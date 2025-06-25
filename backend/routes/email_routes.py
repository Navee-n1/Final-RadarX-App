from flask import Blueprint, request, jsonify
from utils.emailer import send_email_with_attachments
from models import db, EmailLog, JD
import os

email_bp = Blueprint('email_bp', __name__)

@email_bp.route('/send-email/manual', methods=['POST'])
def send_manual_email():
    data = request.json
    jd_id = data.get('jd_id')
    to_email = data.get('to_email')
    cc_list = data.get('cc_list', [])
    attachments = data.get('attachments', [])
    subject = data.get('subject', 'Top Matches')
    body = data.get('body', '')

    if not jd_id or not to_email or not attachments:
        return jsonify({"error": "Missing required fields"}), 400

    # Filter out any invalid paths
    valid_attachments = [f for f in attachments if f and os.path.exists(f)]
    if not valid_attachments:
        return jsonify({"error": "No valid attachments found"}), 400

    status = send_email_with_attachments(subject, body, to_email, cc_list, valid_attachments, jd_id)

    # Save to email log
    email_log = EmailLog(
        jd_id=jd_id,
        sent_to=to_email,
        cc=", ".join(cc_list),
        status="Sent" if "success" in status.lower() else "Failed",
        pdf_path=", ".join(valid_attachments)  # optional
    )
    db.session.add(email_log)
    db.session.commit()

    return jsonify({"message": status})
