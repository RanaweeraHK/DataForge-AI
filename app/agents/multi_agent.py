"""
Multi-Agent System using LangGraph.

Graph:
  planner → [rag_agent | data_agent | calculator_agent | direct_agent]
           → response_agent → END
"""
from typing import TypedDict, Literal
from langgraph.graph import StateGraph, END
from app.utils.llm import get_llm
from app.utils.tools import rag_search, data_query, calculator


# ── State ─────────────────────────────────────────────────────────────────────

class AgentState(TypedDict):
    query: str
    route: str          # which agent to call
    tool_output: str    # raw tool result
    response: str       # final answer


# ── Planner ───────────────────────────────────────────────────────────────────

def planner_node(state: AgentState) -> AgentState:
    """Decide which specialist agent should handle the query."""
    llm = get_llm()
    prompt = (
        "You are a routing agent. Classify the user query into exactly one category:\n"
        "- 'rag'        : question about an uploaded document / PDF\n"
        "- 'data'       : question about a dataset / CSV / statistics\n"
        "- 'calculator' : mathematical calculation or formula\n"
        "- 'direct'     : general knowledge / conversation\n\n"
        f"Query: {state['query']}\n\n"
        "Reply with ONLY the category word."
    )
    result = llm.invoke(prompt).content.strip().lower()
    # Normalise
    if result not in ("rag", "data", "calculator", "direct"):
        result = "direct"
    return {**state, "route": result}


# ── Specialist agents ─────────────────────────────────────────────────────────

def rag_agent_node(state: AgentState) -> AgentState:
    output = rag_search(state["query"])
    return {**state, "tool_output": output}


def data_agent_node(state: AgentState) -> AgentState:
    output = data_query(state["query"])
    return {**state, "tool_output": output}


def calculator_agent_node(state: AgentState) -> AgentState:
    output = calculator(state["query"])
    return {**state, "tool_output": output}


def direct_agent_node(state: AgentState) -> AgentState:
    llm = get_llm()
    response = llm.invoke(state["query"]).content
    return {**state, "tool_output": response}


# ── Response synthesiser ──────────────────────────────────────────────────────

def response_node(state: AgentState) -> AgentState:
    """Polish the tool output into a final user-facing answer."""
    llm = get_llm()
    prompt = (
        f"User question: {state['query']}\n\n"
        f"Agent output: {state['tool_output']}\n\n"
        "Provide a clear, helpful, and concise final answer to the user."
    )
    final = llm.invoke(prompt).content
    return {**state, "response": final}


# ── Routing function ──────────────────────────────────────────────────────────

def route_after_planner(
    state: AgentState,
) -> Literal["rag_agent", "data_agent", "calculator_agent", "direct_agent"]:
    return f"{state['route']}_agent"


# ── Build graph ───────────────────────────────────────────────────────────────

def build_graph():
    g = StateGraph(AgentState)

    g.add_node("planner", planner_node)
    g.add_node("rag_agent", rag_agent_node)
    g.add_node("data_agent", data_agent_node)
    g.add_node("calculator_agent", calculator_agent_node)
    g.add_node("direct_agent", direct_agent_node)
    g.add_node("response", response_node)

    g.set_entry_point("planner")

    g.add_conditional_edges(
        "planner",
        route_after_planner,
        {
            "rag_agent": "rag_agent",
            "data_agent": "data_agent",
            "calculator_agent": "calculator_agent",
            "direct_agent": "direct_agent",
        },
    )

    for agent in ("rag_agent", "data_agent", "calculator_agent", "direct_agent"):
        g.add_edge(agent, "response")

    g.add_edge("response", END)

    return g.compile()


# Singleton compiled graph
_graph = None


def get_graph():
    global _graph
    if _graph is None:
        _graph = build_graph()
    return _graph


def run_query(query: str) -> dict:
    """Run the multi-agent graph and return the full state."""
    graph = get_graph()
    initial_state: AgentState = {
        "query": query,
        "route": "",
        "tool_output": "",
        "response": "",
    }
    final_state = graph.invoke(initial_state)
    return {
        "query": final_state["query"],
        "route": final_state["route"],
        "tool_output": final_state["tool_output"],
        "response": final_state["response"],
    }

