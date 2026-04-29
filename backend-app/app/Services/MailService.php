<?php

namespace App\Services;

use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Mail;
use Illuminate\Support\Facades\Schema;

class MailService
{
    /**
     * Send a transactional email using runtime SMTP settings stored in `app_settings`.
     * Returns true on success, false (silent) on failure so signup never blocks on email outages.
     */
    public static function send(string $toEmail, string $toName, string $subject, string $htmlBody): bool
    {
        try {
            $settings = self::loadSettings();

            if ($settings['email_enabled'] !== '1') return false;
            if (empty($settings['smtp_host']) || empty($settings['smtp_from_email'])) return false;

            // Override mailer config at runtime
            config([
                'mail.default' => 'smtp',
                'mail.mailers.smtp.host'       => $settings['smtp_host']     ?? '',
                'mail.mailers.smtp.port'       => (int) ($settings['smtp_port'] ?? 587),
                'mail.mailers.smtp.username'   => $settings['smtp_username'] ?? '',
                'mail.mailers.smtp.password'   => $settings['smtp_password'] ?? '',
                'mail.mailers.smtp.encryption' => $settings['smtp_encryption'] ?? 'tls',
                'mail.from.address'            => $settings['smtp_from_email'],
                'mail.from.name'               => $settings['smtp_from_name'] ?? 'IntelliCert',
            ]);

            Mail::html(self::wrap($subject, $htmlBody), function ($m) use ($toEmail, $toName, $subject) {
                $m->to($toEmail, $toName ?: $toEmail)->subject($subject);
            });
            return true;
        } catch (\Throwable $e) {
            // Don't break the calling flow on email errors
            return false;
        }
    }

    private static function loadSettings(): array
    {
        $defaults = [
            'email_enabled'    => '0',
            'smtp_host'        => '',
            'smtp_port'        => '587',
            'smtp_username'    => '',
            'smtp_password'    => '',
            'smtp_encryption'  => 'tls',
            'smtp_from_email'  => 'noreply@intellicert.com',
            'smtp_from_name'   => 'IntelliCert',
        ];
        if (!Schema::hasTable('app_settings')) return $defaults;
        $stored = DB::table('app_settings')->pluck('setting_value', 'setting_key')->toArray();
        return array_merge($defaults, $stored);
    }

    /** Wrap an HTML body in the IntelliCert email layout (dark navy gradient + brand orange). */
    private static function wrap(string $subject, string $bodyHtml): string
    {
        $safeSubject = htmlspecialchars($subject);
        return <<<HTML
<!doctype html>
<html><head><meta charset="utf-8"><title>{$safeSubject}</title></head>
<body style="margin:0;padding:0;background:#0B1120;font-family:-apple-system,Segoe UI,Roboto,sans-serif;color:#F1F5F9;">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="background:#0B1120;padding:32px 16px;">
    <tr><td align="center">
      <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="max-width:560px;background:linear-gradient(180deg,#131B2E,#0F172A);border-radius:16px;border:1px solid rgba(255,255,255,0.08);overflow:hidden;">
        <tr><td style="background:linear-gradient(135deg,#EA580C,#C2410C);padding:24px 32px;">
          <div style="font-size:18px;font-weight:800;color:#fff;letter-spacing:.2px;">IntelliCert</div>
        </td></tr>
        <tr><td style="padding:32px;color:#CBD5E1;font-size:14px;line-height:1.7;">
          {$bodyHtml}
        </td></tr>
        <tr><td style="padding:16px 32px;background:#070B16;font-size:11px;color:#64748B;text-align:center;">
          You're receiving this because you have an IntelliCert account.
        </td></tr>
      </table>
    </td></tr>
  </table>
</body></html>
HTML;
    }

    // ─── Templates (ports of legacy email.php functions) ──────

    public static function welcomeBody(?string $name): string
    {
        $safe = htmlspecialchars($name ?: 'there');
        return <<<HTML
<h2 style="margin:0 0 16px 0;color:#fff;font-size:20px;">Welcome to IntelliCert!</h2>
<p>Hi {$safe},</p>
<p>Your account has been created and your free trial starts now. You have full access to all features during your trial period.</p>
<ul style="padding-left:20px;margin:16px 0;">
  <li style="margin-bottom:8px;">Study topics with interactive content</li>
  <li style="margin-bottom:8px;">Create and review flashcards</li>
  <li style="margin-bottom:8px;">Test your knowledge with quizzes</li>
  <li style="margin-bottom:8px;">Track your learning progress with spaced repetition</li>
</ul>
<p>Get started by logging into your account and exploring the available topics.</p>
HTML;
    }

    public static function verifyBody(string $code): string
    {
        $safe = htmlspecialchars($code);
        return <<<HTML
<h2 style="margin:0 0 16px 0;color:#fff;font-size:20px;">Verify Your Email</h2>
<p>Please verify your email address using the code below:</p>
<div style="background:#0f172a;border-radius:8px;padding:20px;text-align:center;margin:20px 0;">
  <span style="font-size:32px;font-weight:700;color:#FB923C;letter-spacing:6px;">{$safe}</span>
</div>
<p style="color:#94a3b8;font-size:13px;">This code expires in 24 hours.</p>
HTML;
    }

    public static function passwordResetBody(string $code): string
    {
        $safe = htmlspecialchars($code);
        return <<<HTML
<h2 style="margin:0 0 16px 0;color:#fff;font-size:20px;">Password Reset</h2>
<p>You requested a password reset. Use the code below to reset your password:</p>
<div style="background:#0f172a;border-radius:8px;padding:20px;text-align:center;margin:20px 0;">
  <span style="font-size:32px;font-weight:700;color:#FB923C;letter-spacing:6px;">{$safe}</span>
</div>
<p style="color:#94a3b8;font-size:13px;">This code expires in 15 minutes. If you did not request this, you can safely ignore this email.</p>
HTML;
    }
}
