import smtplib
from email.message import EmailMessage
import os

def send_email_with_attachments(subject, body, to_email, cc_list, attachments, jd_id=None):
    try:
        msg = EmailMessage()
        msg['Subject'] = subject
        msg['From'] = os.environ.get('EMAIL_SENDER')
        msg['To'] = to_email
        if cc_list:
            msg['Cc'] = ', '.join(cc_list)

        # Enhance email with branding
        html_body = f"""
        <html>
        <body style="font-family: Helvetica, Arial, sans-serif; font-size: 14px; color: #1a1a1a;">
            <p>Hello,</p>
            <p>{body.replace('\n', '<br>')}</p>
            <p style="margin-top: 20px;">Warm regards,<br><b>RadarX AI Assistant</b><br>
            <span style="font-size: 12px; color: #555;">Hexaware AI Talent Matching</span></p>
        </body>
        </html>
        """
        msg.set_content(body)
        msg.add_alternative(html_body, subtype='html')

        for path in attachments:
            try:
                with open(path, 'rb') as f:
                    file_data = f.read()
                    file_name = os.path.basename(path)
                    msg.add_attachment(file_data, maintype='application', subtype='octet-stream', filename=file_name)
            except Exception as e:
                print(f"[❌] Failed to attach {path}: {e}")

        with smtplib.SMTP_SSL('smtp.gmail.com', 465) as smtp:
            smtp.login(os.environ.get('EMAIL_SENDER'), os.environ.get('EMAIL_PASSWORD'))
            smtp.send_message(msg)

        return f"Email sent successfully to {to_email}"

    except Exception as e:
        print(f"[❌] Email sending failed: {e}")
        return f"Email failed: {str(e)}"
