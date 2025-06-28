import smtplib
from email.message import EmailMessage
import os

def send_email_with_attachments(subject, to_email, cc_list, html_body, attachments):
    from email.message import EmailMessage
    import smtplib
    import os

    try:
        msg = EmailMessage()
        msg['Subject'] = subject
        msg['From'] = os.environ.get('EMAIL_SENDER')
        msg['To'] = to_email
        if cc_list:
            msg['Cc'] = ', '.join(cc_list)

        msg.set_content("This email requires an HTML-compatible client.")
        msg.add_alternative(html_body, subtype='html')

        for path in attachments:
            with open(path, 'rb') as f:
                file_data = f.read()
                file_name = os.path.basename(path)
                msg.add_attachment(file_data, maintype='application', subtype='octet-stream', filename=file_name)

        with smtplib.SMTP_SSL('smtp.gmail.com', 465) as smtp:
            smtp.login(os.environ.get('EMAIL_ID'), os.environ.get('EMAIL_PASSWORD'))
            smtp.send_message(msg)

        return f"Email sent successfully to {to_email}"

    except Exception as e:
        return f"Email failed: {str(e)}"
