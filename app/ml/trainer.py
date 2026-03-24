"""
ML Training Engine with MLflow tracking.
Trains scikit-learn models on the loaded CSV dataset and logs metrics/artifacts.
"""
import os
import mlflow
import mlflow.sklearn
import pandas as pd
from sklearn.model_selection import train_test_split
from sklearn.preprocessing import LabelEncoder
from sklearn.linear_model import LinearRegression, LogisticRegression
from sklearn.ensemble import RandomForestClassifier, RandomForestRegressor
from sklearn.metrics import (
    mean_squared_error, r2_score,
    accuracy_score, classification_report,
)
from app.utils.data_analyzer import get_dataframe

MLFLOW_TRACKING_URI = os.getenv("MLFLOW_TRACKING_URI", "mlruns")
mlflow.set_tracking_uri(MLFLOW_TRACKING_URI)

SUPPORTED_MODELS = {
    "linear_regression": LinearRegression,
    "logistic_regression": LogisticRegression,
    "random_forest_classifier": RandomForestClassifier,
    "random_forest_regressor": RandomForestRegressor,
}


def _encode_categoricals(df: pd.DataFrame) -> pd.DataFrame:
    """Label-encode all object/category columns."""
    df = df.copy()
    for col in df.select_dtypes(include=["object", "category"]).columns:
        df[col] = LabelEncoder().fit_transform(df[col].astype(str))
    return df


def train_model(
    target_column: str,
    model_name: str = "random_forest_classifier",
    test_size: float = 0.2,
    experiment_name: str = "ai-data-analyst",
) -> dict:
    """
    Train a model on the loaded dataset and log everything to MLflow.

    Returns a dict with run_id, metrics, and model info.
    """
    df = get_dataframe()
    if df is None:
        return {"error": "No dataset loaded. Upload a CSV first."}

    if target_column not in df.columns:
        return {"error": f"Column '{target_column}' not found. Available: {list(df.columns)}"}

    if model_name not in SUPPORTED_MODELS:
        return {"error": f"Model '{model_name}' not supported. Choose from: {list(SUPPORTED_MODELS.keys())}"}

    df = _encode_categoricals(df.dropna())
    X = df.drop(columns=[target_column])
    y = df[target_column]

    X_train, X_test, y_train, y_test = train_test_split(
        X, y, test_size=test_size, random_state=42
    )

    mlflow.set_experiment(experiment_name)

    with mlflow.start_run() as run:
        mlflow.log_param("model", model_name)
        mlflow.log_param("target", target_column)
        mlflow.log_param("test_size", test_size)
        mlflow.log_param("n_features", X.shape[1])
        mlflow.log_param("n_samples", len(df))

        model_cls = SUPPORTED_MODELS[model_name]
        model = model_cls()
        model.fit(X_train, y_train)
        y_pred = model.predict(X_test)

        is_classifier = model_name in ("logistic_regression", "random_forest_classifier")
        metrics = {}

        if is_classifier:
            metrics["accuracy"] = float(accuracy_score(y_test, y_pred))
            report = classification_report(y_test, y_pred, output_dict=True)
            metrics["macro_f1"] = float(report.get("macro avg", {}).get("f1-score", 0))
        else:
            metrics["r2"] = float(r2_score(y_test, y_pred))
            metrics["rmse"] = float(mean_squared_error(y_test, y_pred) ** 0.5)

        for k, v in metrics.items():
            mlflow.log_metric(k, v)

        mlflow.sklearn.log_model(model, artifact_path="model")

        return {
            "run_id": run.info.run_id,
            "experiment": experiment_name,
            "model": model_name,
            "target": target_column,
            "metrics": metrics,
            "mlflow_ui": f"http://localhost:5000/#/experiments",
        }

