<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Str;

return new class extends Migration {
    public function up(): void
    {
        Schema::create('legal_documents', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->enum('type', ['TERMS', 'PRIVACY'])->unique();
            $table->string('title');
            $table->string('version', 50);
            $table->date('effective_date');
            $table->text('summary');
            $table->json('sections');
            $table->timestamp('published_at')->nullable()->index();
            $table->timestamps();
        });

        Schema::table('users', function (Blueprint $table) {
            $table->string('terms_accepted_version', 50)->nullable()->after('terms_accepted_at');
            $table->string('privacy_accepted_version', 50)->nullable()->after('privacy_accepted_at');
        });

        $now = now();
        DB::table('legal_documents')->insert([
            [
                'id' => (string) Str::uuid(),
                'type' => 'TERMS',
                'title' => 'Terms and Conditions',
                'version' => '2026.08',
                'effective_date' => '2026-08-03',
                'summary' => 'These terms explain the rules for creating and using a BizTrack account and business workspace.',
                'sections' => json_encode([
                    ['heading' => '1. Acceptance of these terms', 'body' => 'By creating an account or using BizTrack, you agree to these Terms and Conditions. If you use BizTrack for a business or organisation, you confirm that you have authority to accept these terms on its behalf.'],
                    ['heading' => '2. Accounts and eligibility', 'body' => 'You must provide accurate registration information, keep your credentials confidential, and promptly update information that changes. You are responsible for activity performed through your account unless you notify us of unauthorised access.'],
                    ['heading' => '3. Business workspaces and team access', 'body' => 'A workspace owner controls business settings, invitations, roles, and access. Users joining with an invitation code must only use codes issued to them. Workspace owners are responsible for assigning suitable permissions and removing access when it is no longer required.'],
                    ['heading' => '4. Plans, billing, and upgrades', 'body' => 'New workspaces receive the available Free plan automatically. Paid features, billing periods, taxes, renewal terms, and cancellation rules will be shown before an upgrade is confirmed. Features and reasonable usage limits may differ between plans.'],
                    ['heading' => '5. Acceptable use', 'body' => 'You must not use BizTrack for unlawful, fraudulent, abusive, or harmful activity; interfere with the service; attempt unauthorised access; upload malicious code; or use the platform in a way that violates another person’s rights.'],
                    ['heading' => '6. Your business data', 'body' => 'You retain ownership of the business information you submit. You give us permission to host, process, back up, and display that information only as needed to operate, secure, support, and improve BizTrack. You are responsible for having the rights and lawful basis needed to enter customer, supplier, staff, and transaction data.'],
                    ['heading' => '7. Service availability and changes', 'body' => 'We work to keep BizTrack reliable, but uninterrupted availability is not guaranteed. Maintenance, security events, network failures, or circumstances outside our control may temporarily affect access. We may improve, replace, or discontinue features while taking reasonable steps to avoid unnecessary disruption.'],
                    ['heading' => '8. Intellectual property', 'body' => 'BizTrack, its software, branding, documentation, and original platform content belong to AfrigoTech or its licensors. These terms grant you a limited, non-exclusive right to use the service for your authorised business purposes; they do not transfer ownership of the platform.'],
                    ['heading' => '9. Suspension and termination', 'body' => 'You may stop using BizTrack at any time. We may restrict or suspend access when reasonably necessary for security, legal compliance, non-payment, serious misuse, or breach of these terms. Where practical, we will provide notice and an opportunity to resolve the issue.'],
                    ['heading' => '10. Liability and governing law', 'body' => 'BizTrack is provided with reasonable care, subject to applicable law. To the extent permitted by law, AfrigoTech is not responsible for indirect or consequential losses, lost profits, or losses caused by inaccurate data entered by users. These terms are governed by the laws of Tanzania, and disputes should first be raised with us for good-faith resolution.'],
                    ['heading' => '11. Contact', 'body' => 'Questions about these terms can be sent to info@afrigotech.com.'],
                ], JSON_UNESCAPED_SLASHES | JSON_UNESCAPED_UNICODE),
                'published_at' => $now,
                'created_at' => $now,
                'updated_at' => $now,
            ],
            [
                'id' => (string) Str::uuid(),
                'type' => 'PRIVACY',
                'title' => 'Privacy Policy',
                'version' => '2026.08',
                'effective_date' => '2026-08-03',
                'summary' => 'This policy explains what personal information BizTrack collects, why it is used, and the choices available to you.',
                'sections' => json_encode([
                    ['heading' => '1. Information we collect', 'body' => 'We collect account details such as your name, email address or phone number, verification status, workspace role, and security activity. We also process business records you choose to enter, such as products, sales, expenses, customers, suppliers, staff, invoices, and inventory movements.'],
                    ['heading' => '2. How we use information', 'body' => 'We use information to create and secure accounts, verify users, provide workspace features, process support requests, send essential service messages, prevent abuse, maintain audit records, improve performance, and comply with legal obligations.'],
                    ['heading' => '3. Verification and communications', 'body' => 'Email addresses may receive account activation and password-reset links. Phone numbers selected for registration may receive one-time verification codes through our SMS provider. We do not use verification contact details for unrelated marketing without an appropriate lawful basis or permission.'],
                    ['heading' => '4. How information is shared', 'body' => 'We may share limited information with service providers that help us host the platform, deliver email or SMS, monitor security, store backups, or process payments. They may process information only for the contracted service. We may also disclose information when required by law or to protect users, the public, or the platform.'],
                    ['heading' => '5. Workspace visibility', 'body' => 'Workspace owners and authorised team members can access information according to their assigned roles and permissions. Your organisation controls whom it invites and what access it grants.'],
                    ['heading' => '6. Security', 'body' => 'We use reasonable administrative and technical safeguards, including access controls, password hashing, verification tokens, and activity records. No online system is completely risk-free, so users should use strong passwords, protect devices, and report suspected unauthorised access promptly.'],
                    ['heading' => '7. Data retention', 'body' => 'We retain account and business information while needed to provide the service and for legitimate security, audit, tax, dispute, and legal purposes. Retention periods may vary by record type and applicable obligations. Information may remain briefly in protected backups after deletion from active systems.'],
                    ['heading' => '8. Your choices and rights', 'body' => 'Subject to applicable law, you may request access to, correction of, or deletion of personal information, object to certain processing, or ask questions about how information is used. Some records may need to be retained for legal, security, or accounting reasons.'],
                    ['heading' => '9. Cookies and device storage', 'body' => 'The web and mobile applications may use cookies or local device storage for authentication, security, language preferences, and essential app functionality. Disabling essential storage may prevent sign-in or other features from working correctly.'],
                    ['heading' => '10. Children’s privacy', 'body' => 'BizTrack is intended for business users and is not directed to children. Do not create an account for a child or submit children’s personal information unless you have a lawful reason and appropriate authority.'],
                    ['heading' => '11. Policy updates', 'body' => 'We may update this policy when the service, legal requirements, or processing practices change. The current version and effective date will be shown in the application. Material changes may require renewed acknowledgement.'],
                    ['heading' => '12. Contact', 'body' => 'Privacy questions or requests can be sent to info@afrigotech.com.'],
                ], JSON_UNESCAPED_SLASHES | JSON_UNESCAPED_UNICODE),
                'published_at' => $now,
                'created_at' => $now,
                'updated_at' => $now,
            ],
        ]);
    }

    public function down(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->dropColumn(['terms_accepted_version', 'privacy_accepted_version']);
        });
        Schema::dropIfExists('legal_documents');
    }
};
