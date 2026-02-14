import { Navbar } from '@/components/layout/navbar';
import { Footer } from '@/components/layout/footer';
import { Hero } from '@/components/sections/hero';
import { ValueProps } from '@/components/sections/value-props';
import { FeaturedProducts } from '@/components/sections/featured-products';
import { Community } from '@/components/sections/community';
import { Faq } from '@/components/sections/faq';

export default function Home() {
    return (
        <>
            <Navbar />
            <main>
                <section id='home'>
                    <Hero />
                </section>
                <ValueProps />
                <section id='products'>
                    <FeaturedProducts />
                </section>
                <section id='community'>
                    <Community />
                </section>
                <section id='faq'>
                    <Faq />
                </section>
            </main>
            <Footer />
        </>
    );
}
