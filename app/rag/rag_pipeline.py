from langchain_community.document_loaders import PyPDFLoader
from langchain_community.vectorstores import FAISS
from langchain_text_splitters import RecursiveCharacterTextSplitter
from langchain_ollama import OllamaEmbeddings
from app.utils.llm import get_llm

# Embeddings using nomic-embed-text for best local quality
embeddings = OllamaEmbeddings(model="nomic-embed-text")

# Module-level vectorstore state
_vectorstore = None


def get_vectorstore():
    return _vectorstore


def set_vectorstore(vs):
    global _vectorstore
    _vectorstore = vs


def create_vectorstore(file_path: str):
    loader = PyPDFLoader(file_path)
    documents = loader.load()

    splitter = RecursiveCharacterTextSplitter(chunk_size=500, chunk_overlap=50)
    docs = splitter.split_documents(documents)

    vs = FAISS.from_documents(docs, embeddings)
    set_vectorstore(vs)
    return vs


def query_rag(vectorstore, query: str, k: int = 3) -> str:
    docs = vectorstore.similarity_search(query, k=k)
    context = "\n\n".join([doc.page_content for doc in docs])

    prompt = (
        "You are a helpful assistant. Answer the question using ONLY the context below.\n"
        "If the answer is not in the context, say 'I don't have enough information.'\n\n"
        f"Context:\n{context}\n\n"
        f"Question: {query}\n\n"
        "Answer:"
    )

    llm = get_llm()
    response = llm.invoke(prompt)
    return response.content