import Header from "./header";
import Footer from "./footer";

interface LayoutProps {
  children: React.ReactNode;
}

export default function Layout({ children }: LayoutProps) {
  return (
    <div className="max-w-screen-xl container mx-auto md:px-10">
      <Header />
      <main>{children}</main>
      <Footer />
    </div>
  );
}
