import logging
import time
from typing import Optional, Dict, Any
from app.core.config import settings

logger = logging.getLogger("talentiq.email")

# HTML email templates
TEMPLATES = {
    "welcome": {
        "subject": "Welcome to TalentIQ AI!",
        "body": """
        <div style="font-family: -apple-system, sans-serif; max-width: 600px; margin: 0 auto; padding: 32px;">
            <div style="background: linear-gradient(135deg, #1e40af, #7c3aed); border-radius: 16px; padding: 32px; text-align: center; margin-bottom: 24px;">
                <h1 style="color: white; font-size: 24px; margin: 0;">Welcome to TalentIQ AI</h1>
                <p style="color: rgba(255,255,255,0.8); margin-top: 8px;">AI-Powered Recruitment Platform</p>
            </div>
            <div style="padding: 0 16px;">
                <h2 style="color: #18181b;">Hi {name},</h2>
                <p style="color: #52525b; line-height: 1.6;">Your account has been created successfully. You now have access to AI-powered job matching, resume analysis, and smart recruitment tools.</p>
                <a href="{dashboard_url}" style="display: inline-block; background: #2563eb; color: white; padding: 12px 24px; border-radius: 8px; text-decoration: none; font-weight: 600; margin-top: 16px;">Go to Dashboard</a>
            </div>
            <div style="padding: 24px 16px; text-align: center; color: #a1a1aa; font-size: 12px;">
                <p>TalentIQ AI - Smart Hiring Platform</p>
            </div>
        </div>
        """,
    },
    "interview_invite": {
        "subject": "Interview Invitation: {job_title} at {company}",
        "body": """
        <div style="font-family: -apple-system, sans-serif; max-width: 600px; margin: 0 auto; padding: 32px;">
            <div style="background: #f0fdf4; border: 1px solid #bbf7d0; border-radius: 12px; padding: 24px; margin-bottom: 24px;">
                <h1 style="color: #166534; font-size: 20px; margin: 0;">Interview Invitation</h1>
            </div>
            <div style="padding: 0 16px;">
                <p style="color: #52525b; line-height: 1.6;">Hi {name},</p>
                <p style="color: #52525b; line-height: 1.6;">We'd like to invite you for an interview for the <strong>{job_title}</strong> position at <strong>{company}</strong>.</p>
                <div style="background: #f4f4f5; border-radius: 8px; padding: 16px; margin: 16px 0;">
                    <p style="margin: 4px 0; color: #3f3f46;"><strong>Date:</strong> {date}</p>
                    <p style="margin: 4px 0; color: #3f3f46;"><strong>Time:</strong> {time}</p>
                    <p style="margin: 4px 0; color: #3f3f46;"><strong>Mode:</strong> {mode}</p>
                    {meeting_link}<br>
                    {notes_block}
                </div>
                <p style="color: #52525b;">Please confirm your attendance by replying to this email.</p>
            </div>
        </div>
        """,
    },
    "application_update": {
        "subject": "Application Update: {job_title}",
        "body": """
        <div style="font-family: -apple-system, sans-serif; max-width: 600px; margin: 0 auto; padding: 32px;">
            <div style="background: #eff6ff; border: 1px solid #bfdbfe; border-radius: 12px; padding: 24px; margin-bottom: 24px;">
                <h1 style="color: #1e40af; font-size: 20px; margin: 0;">Application Update</h1>
            </div>
            <div style="padding: 0 16px;">
                <p style="color: #52525b; line-height: 1.6;">Hi {name},</p>
                <p style="color: #52525b; line-height: 1.6;">Your application for <strong>{job_title}</strong> at <strong>{company}</strong> has been updated to: <strong>{status}</strong></p>
                {feedback_block}
            </div>
        </div>
        """,
    },
    "rejection": {
        "subject": "Application Update: {job_title}",
        "body": """
        <div style="font-family: -apple-system, sans-serif; max-width: 600px; margin: 0 auto; padding: 32px;">
            <div style="padding: 0 16px;">
                <p style="color: #52525b; line-height: 1.6;">Hi {name},</p>
                <p style="color: #52525b; line-height: 1.6;">Thank you for your interest in the <strong>{job_title}</strong> position at <strong>{company}</strong>. After careful consideration, we've decided to move forward with other candidates.</p>
                <p style="color: #52525b; line-height: 1.6;">We encourage you to apply for other positions that match your skills.</p>
            </div>
        </div>
        """,
    },
    "job_recommendation": {
        "subject": "New Job Recommendations for You",
        "body": """
        <div style="font-family: -apple-system, sans-serif; max-width: 600px; margin: 0 auto; padding: 32px;">
            <div style="background: linear-gradient(135deg, #7c3aed, #2563eb); border-radius: 16px; padding: 32px; text-align: center; margin-bottom: 24px;">
                <h1 style="color: white; font-size: 20px; margin: 0;">New Job Matches</h1>
                <p style="color: rgba(255,255,255,0.8); margin-top: 8px;">We found jobs that match your skills</p>
            </div>
            <div style="padding: 0 16px;">
                <p style="color: #52525b; line-height: 1.6;">Hi {name},</p>
                <p style="color: #52525b;">Based on your profile, here are personalized job recommendations:</p>
                {jobs_list}
            </div>
        </div>
        """,
    },
    "weekly_digest": {
        "subject": "Your Weekly TalentIQ Digest",
        "body": """
        <div style="font-family: -apple-system, sans-serif; max-width: 600px; margin: 0 auto; padding: 32px;">
            <div style="background: #18181b; border-radius: 16px; padding: 32px; text-align: center; margin-bottom: 24px;">
                <h1 style="color: white; font-size: 20px; margin: 0;">Weekly Digest</h1>
                <p style="color: #a1a1aa; margin-top: 8px;">Your recruitment activity summary</p>
            </div>
            <div style="padding: 0 16px;">
                <p style="color: #52525b;">Hi {name},</p>
                {digest_content}
            </div>
        </div>
        """,
    },
}


class EmailService:
    def __init__(self):
        self._client = None

    def _get_client(self):
        if self._client is None:
            from app.core.supabase import get_supabase_client
            self._client = get_supabase_client()
        return self._client

    def _render_template(self, template_name: str, variables: Dict[str, str]) -> tuple[str, str]:
        template = TEMPLATES.get(template_name)
        if not template:
            raise ValueError(f"Unknown template: {template_name}")

        subject = template["subject"]
        body = template["body"]

        for key, value in variables.items():
            placeholder = "{" + key + "}"
            subject = subject.replace(placeholder, str(value))
            body = body.replace(placeholder, str(value))

        return subject, body

    def queue_email(
        self,
        to_email: str,
        template_name: str,
        variables: Dict[str, str],
        to_user_id: str = None,
    ) -> bool:
        try:
            subject, body = self._render_template(template_name, variables)

            client = self._get_client()
            record = {
                "to_email": to_email,
                "to_user_id": to_user_id,
                "subject": subject,
                "body": body,
                "email_type": template_name,
                "status": "pending",
            }
            client.table("email_queue").insert(record).execute()
            logger.info(f"Email queued: {template_name} to {to_email}")
            return True
        except Exception as e:
            logger.error(f"Failed to queue email: {e}")
            return False

    def send_pending(self, batch_size: int = 10) -> int:
        try:
            client = self._get_client()
            result = (
                client.table("email_queue")
                .select("*")
                .eq("status", "pending")
                .lt("attempts", 3)
                .order("created_at")
                .limit(batch_size)
                .execute()
            )
            emails = result.data or []
            sent = 0

            for email in emails:
                success = self._send_email(
                    to_email=email["to_email"],
                    subject=email["subject"],
                    body=email["body"],
                )
                new_status = "sent" if success else "failed"
                new_attempts = email["attempts"] + 1
                update = {"status": new_status, "attempts": new_attempts}
                if success:
                    update["sent_at"] = "now()"
                elif new_attempts >= email["max_attempts"]:
                    update["error_message"] = "Max attempts exceeded"

                client.table("email_queue").update(update).eq("id", email["id"]).execute()
                if success:
                    sent += 1

            return sent
        except Exception as e:
            logger.error(f"Failed to send pending emails: {e}")
            return 0

    def _send_email(self, to_email: str, subject: str, body: str) -> bool:
        provider = settings.EMAIL_PROVIDER

        if provider == "resend":
            return self._send_via_resend(to_email, subject, body)
        elif provider == "sendgrid":
            return self._send_via_sendgrid(to_email, subject, body)
        else:
            logger.warning(f"Unknown email provider: {provider}. Email logged but not sent.")
            return True

    def _send_via_resend(self, to_email: str, subject: str, body: str) -> bool:
        if not settings.RESEND_API_KEY:
            logger.warning("RESEND_API_KEY not configured. Email not sent.")
            return False
        try:
            import resend
            resend.api_key = settings.RESEND_API_KEY
            resend.Emails.send({
                "from": settings.EMAIL_FROM,
                "to": [to_email],
                "subject": subject,
                "html": body,
            })
            logger.info(f"Email sent via Resend to {to_email}")
            return True
        except Exception as e:
            logger.error(f"Resend email failed: {e}")
            return False

    def _send_via_sendgrid(self, to_email: str, subject: str, body: str) -> bool:
        if not settings.SENDGRID_API_KEY:
            logger.warning("SENDGRID_API_KEY not configured. Email not sent.")
            return False
        try:
            import httpx
            response = httpx.post(
                "https://api.sendgrid.com/v3/mail/send",
                headers={
                    "Authorization": f"Bearer {settings.SENDGRID_API_KEY}",
                    "Content-Type": "application/json",
                },
                json={
                    "personalizations": [{"to": [{"email": to_email}]}],
                    "from": {"email": settings.EMAIL_FROM},
                    "subject": subject,
                    "content": [{"type": "text/html", "value": body}],
                },
                timeout=10,
            )
            success = response.status_code in (200, 202)
            if not success:
                logger.error(f"SendGrid failed: {response.status_code} {response.text}")
            return success
        except Exception as e:
            logger.error(f"SendGrid email failed: {e}")
            return False


email_service = EmailService()
