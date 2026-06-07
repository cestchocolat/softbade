export default function Navbar() {
  return (
    <header className="nav-shell">
      <div className="nav-inner">
        {/* LEFT: LOGO */}
        <div className="nav-left">
          <a href="/" className="nav-logo">
            Softbade<span className="nav-logo-dot">.</span>
          </a>
        </div>

        {/* CENTER: LINKS */}
        <nav className="nav-center">
          <a href="/" className="nav-link">
            Home
          </a>
          <a href="/blog" className="nav-link">
            Blog
          </a>
          <a href="/about" className="nav-link">
            About
          </a>
          <a href="/contact" className="nav-link">
            Contact
          </a>
        </nav>

        {/* RIGHT: CATEGORIES DROPDOWN */}
        <div className="nav-right">
          <div className="nav-categories">
            <button type="button" className="nav-contact-btn">
              Categories
            </button>

            <div className="categories-dropdown">
              <a href="/categories/ai-automation">AI &amp; Automation</a>
              <a href="/categories/marketing-seo">Marketing &amp; SEO</a>
              <a href="/categories/productivity">Productivity</a>
              <a href="/categories/crm-sales">CRM &amp; Sales</a>
              <a href="/categories/design-creative">Design &amp; Creative</a>
              <a href="/categories/finance-tools">Finance Tools</a>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}
