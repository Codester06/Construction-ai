import os
from typing import List, Dict
from langchain_groq import ChatGroq
from langchain_huggingface import HuggingFaceEmbeddings
from langchain_chroma import Chroma
from langchain_core.messages import HumanMessage, AIMessage, SystemMessage
from langchain_core.prompts import PromptTemplate

class ConstructionRAG:
    def __init__(self):
        api_key = os.getenv("GROQ_API_KEY")
        if not api_key:
            raise ValueError("Please set a valid GROQ_API_KEY in the .env file")

        self.llm = ChatGroq(
            model="llama-3.3-70b-versatile",
            groq_api_key=api_key,
            temperature=0.1,        # low temp = factual, less hallucination
            max_tokens=4096,
        )

        self.embeddings = HuggingFaceEmbeddings(
            model_name="sentence-transformers/all-MiniLM-L6-v2"
        )

        self.vectorstore = Chroma(
            persist_directory="./chroma_db",
            embedding_function=self.embeddings
        )

        self.system_prompt = """You are a specialized Construction Site Report Generator.

STRICT RULES:
- ONLY generate construction-related content based on the information provided to you.
- Do NOT invent, assume, or fabricate any details not explicitly given in the input.
- If a field is empty or unknown, write "Not specified" — never guess.
- Use professional construction terminology.
- Be precise, factual, and concise.
- If asked about non-construction topics, politely decline.

EXPERTISE AREAS:
- Site inspections and daily reporting
- Safety compliance and PPE
- Progress tracking and scheduling
- Quality control and materials
- Workforce and equipment reporting"""

    def generate_report(
        self,
        project_name: str,
        project_number: str,
        date: str,
        location: str,
        contractor: str,
        weather: str,
        report_type: str,
        topic: str,
        tone: str = "standard",
        length: str = "detailed",
        include_safety: bool = True,
        include_materials: bool = True,
        include_photos: bool = True
    ) -> str:
        context_docs = self.vectorstore.similarity_search(topic, k=3)
        context = "\n\n".join([doc.page_content for doc in context_docs]) if context_docs else "No additional context available."

        # Keyword-based section detection — only include sections relevant to the topic
        topic_lower = topic.lower()

        sections = ["Executive Summary", "Site Observations"]

        if any(w in topic_lower for w in ["safety", "hazard", "ppe", "incident", "risk", "accident", "injury", "protective", "compliance"]):
            sections.append("Safety Notes")

        if any(w in topic_lower for w in ["material", "concrete", "steel", "timber", "supply", "delivery", "equipment", "crane", "excavator", "machine", "tool", "scaffold"]):
            sections.append("Materials & Equipment")

        if any(w in topic_lower for w in ["worker", "labour", "labor", "crew", "manpower", "staff", "team", "workforce", "subcontractor"]):
            sections.append("Workforce Summary")

        if any(w in topic_lower for w in ["quality", "inspection", "test", "defect", "snag", "punch", "standard", "spec", "compliance", "check"]):
            sections.append("Quality Control")

        if any(w in topic_lower for w in ["issue", "problem", "delay", "block", "obstruct", "challenge", "concern", "risk"]):
            sections.append("Issues & Risks")

        sections += ["Recommendations", "Next Steps"]
        sections_text = ", ".join(sections)

        tone_instructions = {
            "formal": "Use formal, professional language. Avoid contractions. Write in third person. Use precise technical terminology suitable for client or regulatory submission.",
            "standard": "Use clear, professional language. Balanced between formal and conversational. Suitable for internal team reporting.",
            "detailed": "Use thorough, descriptive language. Explain context and reasoning behind observations. Include more elaboration on each point.",
        }
        length_instructions = {
            "brief": "Keep the report concise. 1-2 sentences per section. Total report should be under 300 words. Only include the most critical information.",
            "standard": "Write a balanced report. 3-5 sentences per section. Total report around 400-600 words.",
            "detailed": "Write a comprehensive report. Full paragraphs per section. Include all relevant observations, measurements, and context. Total report 700+ words.",
        }
        tone_text = tone_instructions.get(tone, "Use clear, professional language.")
        length_text = length_instructions.get(length, "Write a balanced report.")

        prompt_template = f"""{self.system_prompt}

Generate a professional {report_type} using clean Markdown formatting.

IMPORTANT: Only use the project details and topic description provided below. Do not invent names, numbers, dates, or events not mentioned.

## PROJECT INFORMATION

| Field | Details |
|-------|---------|
| Project Name | {project_name or "Not specified"} |
| Project Number | {project_number or "Not specified"} |
| Date | {date} |
| Location | {location or "Not specified"} |
| Contractor | {contractor or "Not specified"} |
| Weather | {weather or "Not specified"} |

TONE INSTRUCTION ({tone}): {tone_text}

LENGTH INSTRUCTION ({length}): {length_text}

REPORT TOPIC / DESCRIPTION:
{{topic}}

RELEVANT CONSTRUCTION KNOWLEDGE (use only if directly applicable):
{{context}}

OUTPUT FORMAT RULES:
- Use ## for main section headings
- Use ### for sub-headings
- Use markdown tables for structured data
- Use **bold** for key terms
- Use bullet points (- item) for observations
- Use horizontal rules (---) between major sections
- Keep the PROJECT INFORMATION table at the top exactly as shown
- ONLY include these sections (do not add any others): {sections_text}
- Only include a section if it is directly relevant to the topic description — skip it entirely if not mentioned or implied
- If any detail is unknown, write "Not specified" — never fabricate
"""

        prompt = PromptTemplate(
            template=prompt_template,
            input_variables=["topic", "context"]
        )

        formatted_prompt = prompt.format(topic=topic, context=context)
        response = self.llm.invoke(formatted_prompt)
        return response.content

    def chat(self, message: str, history: List[Dict] = []) -> str:
        context_docs = self.vectorstore.similarity_search(message, k=3)
        context = "\n\n".join([doc.page_content for doc in context_docs]) if context_docs else "No additional context available."

        has_history = len(history) > 0
        history_note = (
            "The conversation history is provided above. Use it to answer follow-up questions."
            if has_history
            else "This is the START of the conversation. You have NO memory of any previous messages. "
                 "If the user asks what they said before or references a prior conversation, "
                 "tell them you have no record of it and this is a fresh session."
        )

        system_content = f"""{self.system_prompt}

You are a helpful construction expert assistant.

RULES FOR THIS RESPONSE:
- Only answer based on established construction knowledge and the context below.
- If you are not certain about something, say "I'm not sure" rather than guessing.
- Do not invent statistics, standards, or regulations unless you are certain they are accurate.
- Keep answers SHORT and CONCISE — maximum 3-5 sentences or a brief bullet list.
- No lengthy introductions or summaries. Get straight to the point.
- If the question is unrelated to construction, politely redirect in one sentence.
- MEMORY: {history_note}
- NEVER use the "RELEVANT CONSTRUCTION KNOWLEDGE" section to answer questions about what the user said — that is document context, not conversation history.

RELEVANT CONSTRUCTION KNOWLEDGE (use only for factual construction questions):
{context}
"""

        messages_to_send = [SystemMessage(content=system_content)]

        for turn in history:
            if turn["role"] == "user":
                messages_to_send.append(HumanMessage(content=turn["content"]))
            else:
                messages_to_send.append(AIMessage(content=turn["content"]))

        messages_to_send.append(HumanMessage(content=message))

        response = self.llm.invoke(messages_to_send)
        return response.content
