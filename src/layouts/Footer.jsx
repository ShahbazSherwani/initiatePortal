import React from "react";
import { Link } from "react-router-dom";

/* ───────────────── SVG Icon Components ───────────────── */

const FacebookIcon = () => (
  <svg viewBox="0 0 24 24" fill="currentColor" width="16" height="16"><path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/></svg>
);
const XIcon = () => (
  <svg viewBox="0 0 24 24" fill="currentColor" width="14" height="14"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/></svg>
);
const InstagramIcon = () => (
  <svg viewBox="0 0 24 24" fill="currentColor" width="16" height="16"><path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z"/></svg>
);
const LinkedInIcon = () => (
  <svg viewBox="0 0 24 24" fill="currentColor" width="16" height="16"><path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 01-2.063-2.065 2.064 2.064 0 112.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/></svg>
);
const TikTokIcon = () => (
  <svg viewBox="0 0 24 24" fill="currentColor" width="16" height="16"><path d="M12.525.02c1.31-.02 2.61-.01 3.91-.02.08 1.53.63 3.09 1.75 4.17 1.12 1.11 2.7 1.62 4.24 1.79v4.03c-1.44-.05-2.89-.35-4.2-.97-.57-.26-1.1-.59-1.62-.93-.01 2.92.01 5.84-.02 8.75-.08 1.4-.54 2.79-1.35 3.94-1.31 1.92-3.58 3.17-5.91 3.21-1.43.08-2.86-.31-4.08-1.03-2.02-1.19-3.44-3.37-3.65-5.71-.02-.5-.03-1-.01-1.49.18-1.9 1.12-3.72 2.58-4.96 1.66-1.44 3.98-2.13 6.15-1.72.02 1.48-.04 2.96-.04 4.44-.99-.32-2.15-.23-3.02.37-.63.41-1.11 1.04-1.36 1.75-.21.51-.15 1.07-.14 1.61.24 1.64 1.82 3.02 3.5 2.87 1.12-.01 2.19-.66 2.77-1.61.19-.33.4-.67.41-1.06.1-1.79.06-3.57.07-5.36.01-4.03-.01-8.05.02-12.07z"/></svg>
);
const RedditIcon = () => (
  <svg viewBox="0 0 24 24" fill="currentColor" width="16" height="16"><path d="M12 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0zm5.01 4.744c.688 0 1.25.561 1.25 1.249a1.25 1.25 0 0 1-2.498.056l-2.597-.547-.8 3.747c1.824.07 3.48.632 4.674 1.488.308-.309.73-.491 1.207-.491.968 0 1.754.786 1.754 1.754 0 .716-.435 1.333-1.01 1.614a3.111 3.111 0 0 1 .042.52c0 2.694-3.13 4.87-7.004 4.87-3.874 0-7.004-2.176-7.004-4.87 0-.183.015-.366.043-.534A1.748 1.748 0 0 1 4.028 12c0-.968.786-1.754 1.754-1.754.463 0 .898.196 1.207.49 1.207-.883 2.878-1.43 4.744-1.487l.885-4.182a.342.342 0 0 1 .14-.197.35.35 0 0 1 .238-.042l2.906.617a1.214 1.214 0 0 1 1.108-.701zM9.25 12C8.561 12 8 12.562 8 13.25c0 .687.561 1.248 1.25 1.248.687 0 1.248-.561 1.248-1.249 0-.688-.561-1.249-1.249-1.249zm5.5 0c-.687 0-1.248.561-1.248 1.25 0 .687.561 1.248 1.249 1.248.688 0 1.249-.561 1.249-1.249 0-.687-.562-1.249-1.25-1.249zm-5.466 3.99a.327.327 0 0 0-.231.094.33.33 0 0 0 0 .463c.842.842 2.484.913 2.961.913.477 0 2.105-.056 2.961-.913a.361.361 0 0 0 .029-.463.33.33 0 0 0-.464 0c-.547.533-1.684.73-2.512.73-.828 0-1.979-.196-2.512-.73a.326.326 0 0 0-.232-.095z"/></svg>
);
const DiscordIcon = () => (
  <svg viewBox="0 0 24 24" fill="currentColor" width="16" height="16"><path d="M20.317 4.3698a19.7913 19.7913 0 00-4.8851-1.5152.0741.0741 0 00-.0785.0371c-.211.3753-.4447.8648-.6083 1.2495-1.8447-.2762-3.68-.2762-5.4868 0-.1636-.3933-.4058-.8742-.6177-1.2495a.077.077 0 00-.0785-.037 19.7363 19.7363 0 00-4.8852 1.515.0699.0699 0 00-.0321.0277C.5334 9.0458-.319 13.5799.0992 18.0578a.0824.0824 0 00.0312.0561c2.0528 1.5076 4.0413 2.4228 5.9929 3.0294a.0777.0777 0 00.0842-.0276c.4616-.6304.8731-1.2952 1.226-1.9942a.076.076 0 00-.0416-.1057c-.6528-.2476-1.2743-.5495-1.8722-.8923a.077.077 0 01-.0076-.1277c.1258-.0943.2517-.1923.3718-.2914a.0743.0743 0 01.0776-.0105c3.9278 1.7933 8.18 1.7933 12.0614 0a.0739.0739 0 01.0785.0095c.1202.099.246.1981.3728.2924a.077.077 0 01-.0066.1276 12.2986 12.2986 0 01-1.873.8914.0766.0766 0 00-.0407.1067c.3604.698.7719 1.3628 1.225 1.9932a.076.076 0 00.0842.0286c1.961-.6067 3.9495-1.5219 6.0023-3.0294a.077.077 0 00.0313-.0552c.5004-5.177-.8382-9.6739-3.5485-13.6604a.061.061 0 00-.0312-.0286zM8.02 15.3312c-1.1825 0-2.1569-1.0857-2.1569-2.419 0-1.3332.9555-2.4189 2.157-2.4189 1.2108 0 2.1757 1.0952 2.1568 2.419 0 1.3332-.9555 2.4189-2.1569 2.4189zm7.9748 0c-1.1825 0-2.1569-1.0857-2.1569-2.419 0-1.3332.9554-2.4189 2.1569-2.4189 1.2108 0 2.1757 1.0952 2.1568 2.419 0 1.3332-.946 2.4189-2.1568 2.4189z"/></svg>
);
const PinterestIcon = () => (
  <svg viewBox="0 0 24 24" fill="currentColor" width="16" height="16"><path d="M12.017 0C5.396 0 .029 5.367.029 11.987c0 5.079 3.158 9.417 7.618 11.162-.105-.949-.199-2.403.041-3.439.219-.937 1.406-5.957 1.406-5.957s-.359-.72-.359-1.781c0-1.668.967-2.914 2.171-2.914 1.023 0 1.518.769 1.518 1.69 0 1.029-.655 2.568-.994 3.995-.283 1.194.599 2.169 1.777 2.169 2.133 0 3.772-2.249 3.772-5.495 0-2.873-2.064-4.882-5.012-4.882-3.414 0-5.418 2.561-5.418 5.207 0 1.031.397 2.138.893 2.738a.36.36 0 0 1 .083.345l-.333 1.36c-.053.22-.174.267-.402.161-1.499-.698-2.436-2.889-2.436-4.649 0-3.785 2.75-7.262 7.929-7.262 4.163 0 7.398 2.967 7.398 6.931 0 4.136-2.607 7.464-6.227 7.464-1.216 0-2.359-.631-2.75-1.378l-.748 2.853c-.271 1.043-1.002 2.35-1.492 3.146C9.57 23.812 10.763 24 12.017 24c6.624 0 11.99-5.367 11.99-11.988C24.007 5.367 18.641 0 12.017 0z"/></svg>
);
const YouTubeIcon = () => (
  <svg viewBox="0 0 24 24" fill="currentColor" width="16" height="16"><path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/></svg>
);

const MailFilledIcon = () => (
  <svg viewBox="0 0 24 24" fill="#1B5E20" width="18" height="18"><path d="M20 4H4c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 4l-8 5-8-5V6l8 5 8-5v2z"/></svg>
);
const PhoneFilledIcon = () => (
  <svg viewBox="0 0 24 24" fill="#1B5E20" width="18" height="18"><path d="M6.62 10.79c1.44 2.83 3.76 5.14 6.59 6.59l2.2-2.2c.27-.27.67-.36 1.02-.24 1.12.37 2.33.57 3.57.57.55 0 1 .45 1 1V20c0 .55-.45 1-1 1-9.39 0-17-7.61-17-17 0-.55.45-1 1-1h3.5c.55 0 1 .45 1 1 0 1.25.2 2.45.57 3.57.11.35.03.74-.25 1.02l-2.2 2.2z"/></svg>
);
const LocationFilledIcon = () => (
  <svg viewBox="0 0 24 24" fill="#1B5E20" width="18" height="18"><path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"/></svg>
);
const WarningIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="18" height="18"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12" y2="17.01"/></svg>
);

/* ───────────────── Data ───────────────── */

const socialLinks = [
  { icon: FacebookIcon, href: "https://www.facebook.com/1nitiate.ph", label: "Facebook" },
  { icon: XIcon, href: "https://x.com/initiateph", label: "X" },
  { icon: InstagramIcon, href: "https://www.instagram.com/initiateph", label: "Instagram" },
  { icon: LinkedInIcon, href: "https://ph.linkedin.com/company/initiateph", label: "LinkedIn" },
  { icon: TikTokIcon, href: "https://www.tiktok.com/@initiate.ph", label: "TikTok" },
  { icon: RedditIcon, href: "https://www.reddit.com/r/InitiatePH/", label: "Reddit" },
  { icon: DiscordIcon, href: "https://discord.gg/TDydxjUw", label: "Discord" },
  { icon: PinterestIcon, href: "https://www.pinterest.com/initiateph/", label: "Pinterest" },
  { icon: YouTubeIcon, href: "https://www.youtube.com/@InitiatePH", label: "YouTube" },
];

const companyLinks = [
  { label: "About Us", href: "/about" },
  { label: "Debt-Based Crowdfunding", href: "/debt-based-crowdfunding" },
  { label: "Equity-Based Crowdfunding", href: "/equity-based-crowdfunding" },
  // { label: "Donation-Based Crowdfunding", href: "/donation-based-crowdfunding" },
  // { label: "Reward-Based Crowdfunding", href: "/reward-based-crowdfunding" },
  { label: "Blogs", href: "/blogs" },
  { label: "FAQs", href: "/faqs" },
  { label: "Contact Us", href: "/contact" },
];

const legalLinks = [
  { label: "Terms & Conditions", href: "/terms-and-conditions" },
  { label: "Risk Disclosure and Disclaimer Policy", href: "/risk-disclosure-and-disclaimer-policy" },
  { label: "Campaign And Project Creator Agreement", href: "/campaign-and-project-creator-agreement" },
  { label: "Donor and Backer Acknowledgement and Pledge Terms", href: "/donor-and-backer-acknowledgement-and-pledge-terms" },
  { label: "Refund and Cancellation Policy", href: "/refund-and-cancellation-policy" },
  { label: "Disclosure And Transparency Policy", href: "/disclosure-and-transparency-policy" },
  { label: "Audit And Reporting Framework", href: "/audit-and-reporting-framework" },
  { label: "Anti-Money Laundering and Counter-Terrorism Financing Policy", href: "/aml-ctf-policy" },
  { label: "Information Security Policy", href: "/information-security-policy" },
  { label: "Governing Law And Jurisdiction Clause", href: "/governing-law-and-jurisdiction-clause" },
  { label: "Terms for Rewards and Fulfilment", href: "/terms-for-rewards-and-fulfilment" },
  { label: "Privacy and Data Protection Compliance Manual", href: "/privacy-and-data-protection-compliance-manual" },
  { label: "Cookie Policy", href: "/cookie-policy" },
  { label: "Privacy Policy", href: "/privacy-policy" },
];

/* ───────────────── Component ───────────────── */

export default function Footer() {
  return (
    <>
      <style>{responsiveCSS}</style>
      <footer className="iph-footer">
        <div className="iph-footer__container">
          {/* Top Section */}
          <div className="iph-footer__top-row">
            <Link to="/" className="iph-footer__logo">
              <img
                src="/images/Logo-1.png"
                alt="Initiate PH"
                className="iph-footer__logo-img"
              />
            </Link>
            <div className="iph-footer__social-row">
              {socialLinks.map((social) => (
                <a
                  key={social.label}
                  href={social.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={social.label}
                  className="iph-footer__social-icon"
                >
                  <social.icon />
                </a>
              ))}
            </div>
          </div>

          <hr className="iph-footer__divider" />

          {/* Columns */}
          <div className="iph-footer__columns">
            <div className="iph-footer__col iph-footer__col--company">
              <h3 className="iph-footer__col-title">Company</h3>
              <ul className="iph-footer__link-list">
                {companyLinks.map((link) => (
                  <li key={link.label}>
                    <Link to={link.href} className="iph-footer__link">{link.label}</Link>
                  </li>
                ))}
              </ul>
            </div>
            <div className="iph-footer__col iph-footer__col--legal">
              <h3 className="iph-footer__col-title">Legal Information</h3>
              <ul className="iph-footer__link-list">
                {legalLinks.map((link) => (
                  <li key={link.label}>
                    <Link to={link.href} className="iph-footer__link">{link.label}</Link>
                  </li>
                ))}
              </ul>
            </div>
            <div className="iph-footer__col iph-footer__col--contact">
              <h3 className="iph-footer__col-title">Contact</h3>
              <div className="iph-footer__contact-list">
                <a href="mailto:info@initiate.ph" className="iph-footer__contact-item">
                  <span className="iph-footer__contact-icon"><MailFilledIcon /></span>
                  <span>info@initiate.ph</span>
                </a>
                <a href="tel:+639123456789" className="iph-footer__contact-item">
                  <span className="iph-footer__contact-icon"><PhoneFilledIcon /></span>
                  <span>0912-345-6789</span>
                </a>
                <a href="https://maps.app.goo.gl/swKVvrLJ8UNRDLs56" target="_blank" rel="noopener noreferrer" className="iph-footer__contact-item">
                  <span className="iph-footer__contact-icon"><LocationFilledIcon /></span>
                  <span>19th Floor Capital House, 9th Ave. corner Lane S, BGC, Taguig City</span>
                </a>
              </div>
            </div>
          </div>

          {/* Risk Warning */}
          <div className="iph-footer__risk-warning">
            <div className="iph-footer__risk-header">
              <WarningIcon />
              <span>RISK WARNING</span>
            </div>
            <p className="iph-footer__risk-text">
              Investing through crowdfunding platform involves significant risks, including the possible loss of your entire investment. Securities offered on this platform are typically issued by early-stage or growing companies and may carry a higher risk compared to traditional investments. These investments are generally illiquid and may not be easily sold or transferred. Returns are not guaranteed, and past performance or projections do not assure future results. Investors should carefully review all available information and invest only funds they can afford to lose.
            </p>
          </div>

          {/* Copyright */}
          <div className="iph-footer__copyright">
            &copy; 2026 Initiate PH, Inc. All rights reserved.
          </div>
        </div>
      </footer>
    </>
  );
}

/* ───────────────── Responsive CSS ───────────────── */

const responsiveCSS = `
  .iph-footer {
    background-color: #ffffff;
    font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
    color: #333333;
    padding: 40px 0 24px;
    width: 100%;
  }
  .iph-footer__container {
    max-width: 1200px;
    margin: 0 auto;
    padding: 0 24px;
  }

  .iph-footer__top-row {
    display: flex;
    justify-content: space-between;
    align-items: center;
    flex-wrap: wrap;
    gap: 16px;
  }
  .iph-footer__logo {
    display: flex;
    align-items: center;
    text-decoration: none;
  }
  .iph-footer__logo-img {
    height: 45px;
    width: auto;
    object-fit: contain;
  }
  .iph-footer__social-row {
    display: flex;
    align-items: center;
    gap: 10px;
    flex-wrap: wrap;
  }
  .iph-footer__social-icon {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 36px;
    height: 36px;
    border-radius: 50%;
    background-color: #1B5E20;
    color: #ffffff;
    text-decoration: none;
    transition: background-color 0.2s ease;
  }
  .iph-footer__social-icon:hover {
    background-color: #2E7D32;
  }

  .iph-footer__divider {
    border: none;
    border-top: 1px solid #e0e0e0;
    margin: 24px 0 32px;
  }

  .iph-footer__columns {
    display: grid;
    grid-template-columns: 1fr 1.4fr 1fr;
    gap: 40px;
    margin-bottom: 40px;
  }
  .iph-footer__col-title {
    font-size: 18px;
    font-weight: 700;
    color: #1B5E20;
    margin: 0 0 16px;
  }
  .iph-footer__link-list {
    list-style: none;
    padding: 0;
    margin: 0;
    display: flex;
    flex-direction: column;
    gap: 10px;
  }
  .iph-footer__link {
    color: #444444;
    text-decoration: none;
    font-size: 14px;
    line-height: 1.5;
    transition: color 0.2s ease;
  }
  .iph-footer__link:hover {
    color: #1B5E20;
  }

  .iph-footer__contact-list {
    display: flex;
    flex-direction: column;
    gap: 14px;
  }
  a.iph-footer__contact-item {
    display: flex;
    align-items: flex-start;
    gap: 10px;
    font-size: 14px;
    color: #444444;
    line-height: 1.5;
    text-decoration: none;
    transition: color 0.2s ease;
  }
  a.iph-footer__contact-item:hover {
    color: #1B5E20;
  }
  .iph-footer__contact-icon {
    flex-shrink: 0;
    margin-top: 1px;
    display: flex;
  }

  .iph-footer__risk-warning {
    background-color: #FFF8E1;
    border: 1px solid #F9A825;
    border-radius: 8px;
    padding: 20px 24px;
    margin-bottom: 32px;
  }
  .iph-footer__risk-header {
    display: flex;
    align-items: center;
    gap: 8px;
    margin-bottom: 10px;
    color: #E65100;
  }
  .iph-footer__risk-header span {
    font-size: 14px;
    font-weight: 700;
    color: #E65100;
    letter-spacing: 0.5px;
  }
  .iph-footer__risk-text {
    font-size: 12.5px;
    color: #5D4037;
    line-height: 1.7;
    margin: 0;
  }

  .iph-footer__copyright {
    font-size: 13px;
    color: #888888;
  }

  @media (max-width: 1023px) {
    .iph-footer__columns {
      grid-template-columns: 1fr 1fr;
      gap: 32px;
    }
    .iph-footer__col--contact {
      grid-column: 1 / -1;
    }
  }

  @media (max-width: 767px) {
    .iph-footer { padding: 32px 0 20px; }
    .iph-footer__container { padding: 0 16px; }
    .iph-footer__top-row { flex-direction: column; align-items: flex-start; gap: 20px; }
    .iph-footer__logo-img { height: 38px; }
    .iph-footer__social-row { gap: 8px; }
    .iph-footer__social-icon { width: 34px; height: 34px; }
    .iph-footer__divider { margin: 20px 0 28px; }
    .iph-footer__columns { grid-template-columns: 1fr; gap: 28px; margin-bottom: 32px; }
    .iph-footer__col--contact { grid-column: auto; }
    .iph-footer__col-title { font-size: 16px; margin-bottom: 12px; }
    .iph-footer__risk-warning { padding: 16px; margin-bottom: 24px; }
    .iph-footer__risk-text { font-size: 12px; line-height: 1.65; }
    .iph-footer__copyright { font-size: 12px; text-align: center; }
  }

  @media (max-width: 399px) {
    .iph-footer__social-row { gap: 6px; }
    .iph-footer__social-icon { width: 32px; height: 32px; }
    .iph-footer__logo-img { height: 32px; }
  }
`;
