'use client';

import { MotionDiv } from '@/components/motion';
import {
    Accordion,
    AccordionContent,
    AccordionItem,
    AccordionTrigger
} from '@/components/ui/accordion';

const faqs = [
    {
        question: 'What frameworks are your scripts compatible with?',
        answer:
            'Our scripts support all major FiveM frameworks including ESX, QBCore, ' +
            'and ox_core. Each product page specifies exact compatibility. We also ' +
            'provide standalone versions where possible.'
    },
    {
        question: 'How do I receive my purchase?',
        answer:
            "After completing your purchase on our Tebex store, you'll receive " +
            'instant access through your Cfx.re Portal account. You can also access ' +
            'downloads directly from your Tebex account dashboard.'
    },
    {
        question: 'Do you offer support after purchase?',
        answer:
            'Yes! We provide premium support through our Discord server. Our team is ' +
            'available to help with installation, configuration, and any issues you ' +
            'encounter. Response times are typically under 24 hours.'
    },
    {
        question: 'Are updates included with my purchase?',
        answer:
            'All purchases include lifetime updates at no additional cost. We regularly ' +
            'release updates with new features, bug fixes, and performance improvements.'
    },
    {
        question: 'Can I get a refund?',
        answer:
            "We offer refunds within 72 hours of purchase if you haven't downloaded " +
            'the product. Once downloaded, we work with you to resolve any issues ' +
            'instead. Please contact support for refund requests.'
    },
    {
        question: 'Do you offer custom development?',
        answer:
            'Yes, we accept custom development requests for FiveM resources. Contact ' +
            'us through Discord to discuss your project requirements, timeline, and ' +
            'pricing.'
    }
];

export function Faq() {
    return (
        <section className='py-24'>
            <div className='mx-auto max-w-3xl px-6'>
                {/* Section header */}
                <MotionDiv className='text-center'>
                    <span
                        className={
                            'inline-flex items-center gap-2 text-xs ' +
                            'font-semibold uppercase tracking-wider text-accent-500'
                        }
                    >
                        <span className='h-1.5 w-1.5 rounded-full bg-accent-500' />
                        FAQ
                    </span>
                    <h2 className={'mt-4 text-4xl font-bold text-white'}>
                        Frequently Asked Questions
                    </h2>
                    <p className='mx-auto mt-4 max-w-lg text-neutral-400'>
                        Everything you need to know about our products and services.
                    </p>
                </MotionDiv>

                {/* Accordion */}
                <MotionDiv className='mt-12' delay={0.2}>
                    <Accordion type='single' collapsible>
                        {faqs.map((faq, i) => (
                            <AccordionItem
                                /* biome-ignore lint/suspicious/noArrayIndexKey: static faq list */
                                key={i}
                                value={`item-${i}`}
                            >
                                <AccordionTrigger className='text-left'>
                                    {faq.question}
                                </AccordionTrigger>
                                <AccordionContent>{faq.answer}</AccordionContent>
                            </AccordionItem>
                        ))}
                    </Accordion>
                </MotionDiv>
            </div>
        </section>
    );
}
