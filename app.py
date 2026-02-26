import streamlit as st
import json

st.set_page_config(
    page_title="ChargeSheet Structurer",
    layout="wide",
)

# ---------------- HEADER ----------------
st.title("📄 ChargeSheet to Structured Format Converter")
st.markdown("Upload a charge sheet PDF and convert it into structured structured data.")

# ---------------- FILE UPLOAD SECTION ----------------
st.subheader("📤 Upload ChargeSheet")

uploaded_file = st.file_uploader(
    "Upload PDF",
    type=["pdf"],
    help="Upload the charge sheet PDF file"
)

st.divider()

# ---------------- PREVIEW SECTION ----------------
st.subheader("📜 Extracted Text Preview")

st.text_area(
    "Raw Text",
    placeholder="Extracted text from the uploaded PDF will appear here...",
    height=250
)

st.divider()

# ---------------- ACTION BUTTON ----------------
col1, col2, col3 = st.columns([1,2,1])

with col2:
    convert_button = st.button("🔍 Convert to Structured Format", use_container_width=True)

st.divider()

# ---------------- STRUCTURED OUTPUT SECTION ----------------
st.subheader("📊 Structured Output")

dummy_output = {
    "Case Number": "123/2025",
    "FIR Number": "456/2025",
    "Police Station": "Civil Lines",
    "IPC Sections": ["420", "406"],
    "Accused Name(s)": ["Rahul Sharma"],
    "Complainant Name": "Amit Verma",
    "Incident Date": "12-01-2025",
    "Filing Date": "15-01-2025",
    "Summary of Incident": "Brief description of the alleged offence.",
    "Evidence Listed": ["CCTV footage", "Call records"],
    "Witnesses": ["Ramesh Kumar", "Suresh Patel"]
}

st.json(dummy_output)

st.download_button(
    label="📥 Download JSON",
    data=json.dumps(dummy_output, indent=4),
    file_name="structured_chargesheet.json",
    mime="application/json",
    use_container_width=True
)