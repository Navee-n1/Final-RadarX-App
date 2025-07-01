import os
import logging
from flask import Blueprint, request, jsonify
from utils.emailer import send_email_with_attachments
from models import db, EmailLog, JD

# Setup logger
logger = logging.getLogger(__name__)
logger.setLevel(logging.INFO)
handler = logging.FileHandler('logs/email_routes.log')
formatter = logging.Formatter('%(asctime)s - %(levelname)s - %(message)s')
handler.setFormatter(formatter)
logger.addHandler(handler)

email_bp = Blueprint('email_bp', __name__)

def get_label(score):
    if score >= 0.8:
        return "☑️ Recommended"
    elif score >= 0.6:
        return "✅ Highly Recommended"
    elif score >= 0.4:
        return "🟡 Decent – Can Explore"
    else:
        return "❌ Not Recommended"

def build_match_summary_html(matches, job_title="the uploaded Job Description"):
    strong_matches = [m for m in matches if m.get("label") in ["☑️ Recommended", "✅ Highly Recommended", "🟡 Decent – Can Explore"]]
    logger.info(f"Building HTML summary for {len(strong_matches)} strong matches")

    if strong_matches:
        rows = "\n".join([
            f"<tr><td style='padding:8px;border:1px solid #ddd;'>{m.get('emp_id')}</td>"
            f"<td style='padding:8px;border:1px solid #ddd;'>{m.get('name')}</td>"
            f"<td style='padding:8px;border:1px solid #ddd;'>{round(m.get('score', 0)*100)}%</td>"
            f"<td style='padding:8px;border:1px solid #ddd;'>{m.get('label')}</td></tr>"
            for m in strong_matches
        ])
        return True, f"""
            <html><body>
            <p>Dear AR Requestor,</p>
            <p>Please find the top consultant matches below for <b>{job_title}</b>:</p>
            <table style="width:100%;border-collapse:collapse;">
            <thead>
                <tr>
                    <th style="padding:8px;border:1px solid #ddd;">Emp ID</th>
                    <th style="padding:8px;border:1px solid #ddd;">Name</th>
                    <th style="padding:8px;border:1px solid #ddd;">Match %</th>
                    <th style="padding:8px;border:1px solid #ddd;">Recommendation</th>
                </tr>
            </thead>
            <tbody>{rows}</tbody>
            </table>
            <p style="margin-top:20px;">Warm regards,<br><b>RadarX AI Assistant</b></p>
            </body></html>
        """
    else:
        logger.info("No strong matches found for email summary")
        return False, """
            <html><body>
            <p>Dear AR Requestor,</p>
            <p>Thank you for using RadarX AI.</p>
            <p>Unfortunately, there are no recommended matches for the uploaded Job description at this time.</p>
            <p style="margin-top:20px;">Warm regards,<br><b>RadarX AI Assistant</b></p>
            </body></html>
        """

@email_bp.route('/send-email/manual', methods=['POST'])
def send_manual_email():
    try:
        data = request.json
        jd_id = data.get('jd_id')
        to_email = data.get('to_email')
        cc_list = data.get('cc_list', [])
        attachments = data.get('attachments', [])
        subject = data.get('subject', 'Top Matches')
        top_matches = data.get('top_matches', [])
        job_title = data.get('job_title', 'the uploaded Job Description')

        logger.info(f"Manual email triggered for JD ID {jd_id} to {to_email} with {len(top_matches)} matches.")

        if not jd_id or not to_email:
            logger.warning("Missing jd_id or to_email in request.")
            return jsonify({"error": "Missing required fields"}), 400

        # Ensure each match has a label
        for m in top_matches:
            if "label" not in m:
                m["label"] = get_label(m.get("score", 0))

        recommended = [m for m in top_matches if m.get("label") in [
            "☑️ Recommended", "✅ Highly Recommended", "🟡 Decent – Can Explore"
        ]]

        valid_attachments = []
        if recommended:
            valid_attachments = [f for f in attachments if f and os.path.exists(f)]
            logger.info(f"Valid attachments found: {valid_attachments}")
        else:
            logger.info("No recommended matches. Email will be sent without attachments.")

        has_matches, html_body = build_match_summary_html(top_matches, job_title)

        # Send email
        status = send_email_with_attachments(
            subject=subject,
            to_email=to_email,
            cc_list=cc_list,
            html_body=html_body,
            attachments=valid_attachments
        )

        logger.info(f"Email status: {status}")

        # Save email log to DB
        email_log = EmailLog(
            jd_id=jd_id,
            sent_to=to_email,
            cc=", ".join(cc_list),
            status="Sent" if "success" in status.lower() else "Failed",
            pdf_path=", ".join(valid_attachments) if valid_attachments else None
        )
        db.session.add(email_log)
        db.session.commit()
        logger.info("Email log entry saved to database.")

        return jsonify({"message": status})

    except Exception as e:
        logger.error(f"Failed to send manual email: {e}", exc_info=True)
        return jsonify({"error": "Internal Server Error"}), 500
