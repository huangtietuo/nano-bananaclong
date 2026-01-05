export function Footer() {
  return (
    <footer className="border-t border-border/40">
      <div className="container px-4 py-12">
        <div className="flex flex-col md:flex-row justify-between items-center gap-6">
          <div className="flex items-center gap-2">
            <div className="text-3xl">🍌</div>
            <span className="text-xl font-bold">Nano Banana</span>
          </div>

          <div className="flex flex-wrap justify-center gap-6 text-sm text-muted-foreground">
            <a href="#generator" className="hover:text-primary transition-colors">
              Generator
            </a>
            <a href="#showcase" className="hover:text-primary transition-colors">
              Showcase
            </a>
            <a href="#reviews" className="hover:text-primary transition-colors">
              Reviews
            </a>
            <a href="#faq" className="hover:text-primary transition-colors">
              FAQ
            </a>
          </div>
        </div>

        <div className="mt-8 pt-8 border-t border-border/40 text-center text-sm text-muted-foreground">
          <p>© 2025 Nano Banana. Experience the future of AI image editing.</p>
          <p className="mt-2 text-xs">Nano Banana is not related to Google or other AI companies.</p>
        </div>
      </div>
    </footer>
  )
}
