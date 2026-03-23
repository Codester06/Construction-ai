"""
Script to ingest construction documents into Chroma vector database.
Run this once to populate the vector DB with construction knowledge.
"""

from langchain_community.embeddings import HuggingFaceEmbeddings
from langchain_community.vectorstores import Chroma
from langchain_text_splitters import RecursiveCharacterTextSplitter
from langchain_core.documents import Document

# Sample construction documents
CONSTRUCTION_DOCS = [
    {
        "content": """DAILY SITE REPORT TEMPLATE
        
Project Name: [Project Name]
Date: [Date]
Weather: [Weather Conditions]
Temperature: [Temperature]

WORK COMPLETED:
- List all work activities completed during the day
- Include specific locations and areas worked
- Note crew sizes and equipment used

MATERIALS DELIVERED:
- List all materials received on site
- Include quantities and supplier information
- Note any damaged or incorrect deliveries

SAFETY OBSERVATIONS:
- Document any safety incidents or near misses
- Note safety equipment usage
- Record safety meetings or toolbox talks

ISSUES/DELAYS:
- Document any problems encountered
- Note causes of delays
- Record impact on schedule

NEXT DAY ACTIVITIES:
- Planned work for following day
- Required materials and equipment
- Crew requirements""",
        "metadata": {"type": "template", "report_type": "daily_site_report"}
    },
    {
        "content": """SAFETY INSPECTION REPORT GUIDELINES
        
INSPECTION CHECKLIST:
1. Personal Protective Equipment (PPE)
   - Hard hats worn by all personnel
   - Safety glasses/goggles in use
   - High-visibility vests worn
   - Steel-toed boots required
   - Hearing protection in loud areas

2. Fall Protection
   - Guardrails properly installed
   - Safety harnesses inspected and used
   - Ladder conditions checked
   - Scaffolding secure and tagged

3. Housekeeping
   - Work areas clean and organized
   - Materials properly stored
   - Debris removed regularly
   - Fire extinguishers accessible

4. Equipment Safety
   - Machinery guards in place
   - Lockout/tagout procedures followed
   - Equipment inspections current
   - Operators properly trained

VIOLATIONS:
Document any safety violations with:
- Location and description
- Severity level
- Corrective action required
- Responsible party
- Completion deadline""",
        "metadata": {"type": "guidelines", "report_type": "safety_inspection"}
    },
    {
        "content": """CONSTRUCTION TERMINOLOGY GLOSSARY

FOUNDATION TERMS:
- Excavation: Removal of earth to create foundation space
- Footings: Concrete base that supports foundation walls
- Rebar: Steel reinforcement bars in concrete
- Formwork: Temporary molds for concrete placement
- Backfill: Soil replaced around foundation after construction

CONCRETE TERMS:
- Slump: Measure of concrete consistency
- Curing: Process of maintaining moisture for concrete strength
- Cold joint: Junction between old and new concrete pours
- Aggregate: Sand and gravel in concrete mix
- PSI: Pounds per square inch, concrete strength measurement

STRUCTURAL TERMS:
- Load-bearing: Walls or columns supporting weight
- Shear wall: Wall resisting lateral forces
- Beam: Horizontal structural member
- Column: Vertical structural support
- Joist: Horizontal framing member for floors/ceilings

SAFETY TERMS:
- Competent person: Trained safety supervisor
- Confined space: Area with limited entry/exit
- Hazard communication: System for chemical safety
- Permit required: Work needing special authorization
- Lockout/tagout: Equipment isolation procedure""",
        "metadata": {"type": "glossary", "category": "terminology"}
    },
    {
        "content": """PROGRESS REPORT BEST PRACTICES

EXECUTIVE SUMMARY:
- Overall project status (on schedule, ahead, behind)
- Percentage complete
- Major milestones achieved
- Critical issues requiring attention

WORK COMPLETED THIS PERIOD:
- Detailed description of completed activities
- Quantities installed (cubic yards, square feet, etc.)
- Quality control testing results
- Photos of completed work

WORK PLANNED NEXT PERIOD:
- Scheduled activities
- Required resources
- Potential challenges
- Coordination requirements

SCHEDULE STATUS:
- Activities on schedule
- Activities behind schedule with reasons
- Recovery plans for delays
- Updated completion forecast

BUDGET STATUS:
- Costs to date vs. budget
- Forecast final cost
- Change orders status
- Payment applications

ISSUES AND RISKS:
- Current problems
- Potential risks
- Mitigation strategies
- Required decisions""",
        "metadata": {"type": "best_practices", "report_type": "progress_report"}
    },
    {
        "content": """QUALITY CONTROL INSPECTION STANDARDS

CONCRETE INSPECTION:
- Verify mix design matches specifications
- Check slump before placement
- Ensure proper reinforcement placement
- Monitor curing procedures
- Test cylinder samples at 7 and 28 days
- Document any defects or repairs

STRUCTURAL STEEL INSPECTION:
- Verify material certifications
- Check member sizes and grades
- Inspect welding quality
- Ensure proper bolt torque
- Verify alignment and plumbness
- Document any field modifications

MASONRY INSPECTION:
- Check mortar mix proportions
- Verify unit sizes and types
- Inspect joint tooling
- Monitor wall alignment
- Test mortar samples
- Document weather protection

WATERPROOFING INSPECTION:
- Verify surface preparation
- Check material application rates
- Inspect seam overlaps
- Test for leaks
- Document protection measures
- Verify manufacturer requirements met""",
        "metadata": {"type": "standards", "category": "quality_control"}
    },
    {
        "content": """INCIDENT REPORT REQUIREMENTS

IMMEDIATE ACTIONS:
1. Ensure scene safety
2. Provide first aid/medical attention
3. Secure the area
4. Notify supervisor immediately
5. Preserve evidence

INCIDENT DETAILS:
- Date, time, and location
- Weather and site conditions
- Personnel involved
- Witnesses present
- Equipment involved
- Activity being performed

INJURY INFORMATION:
- Nature and extent of injury
- Body parts affected
- Medical treatment provided
- Hospital transport if required
- Lost time anticipated

ROOT CAUSE ANALYSIS:
- Immediate cause of incident
- Contributing factors
- Unsafe conditions present
- Unsafe acts performed
- System failures identified

CORRECTIVE ACTIONS:
- Immediate corrections made
- Long-term preventive measures
- Training requirements
- Policy/procedure updates
- Follow-up inspection schedule""",
        "metadata": {"type": "requirements", "report_type": "incident_report"}
    }
]

def ingest_documents():
    """Ingest construction documents into Chroma vector database."""
    
    print("Initializing embeddings...")
    embeddings = HuggingFaceEmbeddings(
        model_name="sentence-transformers/all-MiniLM-L6-v2"
    )
    
    print("Creating text splitter...")
    text_splitter = RecursiveCharacterTextSplitter(
        chunk_size=1000,
        chunk_overlap=200,
        length_function=len
    )
    
    print("Processing documents...")
    documents = []
    for doc in CONSTRUCTION_DOCS:
        chunks = text_splitter.split_text(doc["content"])
        for chunk in chunks:
            documents.append(
                Document(
                    page_content=chunk,
                    metadata=doc["metadata"]
                )
            )
    
    print(f"Created {len(documents)} document chunks")
    
    print("Creating Chroma vector store...")
    vectorstore = Chroma.from_documents(
        documents=documents,
        embedding=embeddings,
        persist_directory="./chroma_db"
    )
    
    print("Persisting vector store...")
    vectorstore.persist()
    
    print("✅ Successfully ingested construction documents into vector database!")
    print(f"   Total documents: {len(CONSTRUCTION_DOCS)}")
    print(f"   Total chunks: {len(documents)}")
    print(f"   Storage location: ./chroma_db")

if __name__ == "__main__":
    ingest_documents()
