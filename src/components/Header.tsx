'use client';

import { useState } from 'react';
import WalletConnect from "./WalletConnect";
import Link from 'next/link';
import Image from 'next/image';
import { useSamoyedCoin } from '@/hooks/useSamoyedCoin';
import { useWallet } from '@/components/WalletConnect';
import { toast } from 'react-toastify';

const Header = () => {
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const { account } = useWallet();
    const { adminList, togglePause } = useSamoyedCoin();
    const isAdmin = adminList.includes(account || '');

    const handleTogglePause = async () => {
        const success = await togglePause();
        if (success) {
            toast.success('Contract pause state toggled successfully');
        } else {
            toast.error('Failed to toggle contract pause state');
        }
    };

    return (
        <header className="bg-[#140f26] shadow-md">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex justify-between items-center py-4 md:justify-start md:space-x-10">
                    {/* Logo */}
                    <div className="flex justify-start lg:w-0 lg:flex-1">
                        <Link href="/">
                            <span className="sr-only">Your Company</span>
                            <Image className="h-8 w-auto sm:h-10" src="/logo.webp" alt="Logo" width={50} height={50} />
                        </Link>
                    </div>

                    {/* Mobile menu button */}
                    <div className="-mr-2 -my-2 md:hidden">
                        <button
                            type="button"
                            className="bg-transparent rounded-md p-2 inline-flex items-center justify-center text-gray-400 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-indigo-500"
                            onClick={() => setIsMenuOpen(!isMenuOpen)}
                        >
                            <span className="sr-only">Open menu</span>
                            <svg className="h-6 w-6" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                            </svg>
                        </button>
                    </div>

                    {/* Desktop menu */}
                    <nav className="hidden md:flex space-x-10">
                        <Link href="/stats" className="text-xl font-medium text-white hover:text-gray-400">
                            Stats
                        </Link>
                        {
                            isAdmin ? <Link href="/config" className="text-xl font-medium text-white hover:text-gray-400">
                                Config
                            </Link> : null
                        }
                    </nav>

                    {/* WalletConnect button */}
                    <div className="hidden md:flex items-center justify-end md:flex-1 lg:w-0">
                        <WalletConnect />
                    </div>
                </div>
            </div>

            {/* Mobile menu, show/hide based on menu state */}
            <div className={`${isMenuOpen ? 'block' : 'hidden'} md:hidden`}>
                <div className="px-2 pt-2 pb-3 space-y-1 sm:px-3">
                    <Link href="/stats" className="block px-3 py-2 rounded-md text-base font-medium text-white hover:text-gray-400">
                        Stats
                    </Link>
                    <Link href="/config" className="block px-3 py-2 rounded-md text-base font-medium text-white hover:text-gray-400">
                        Config
                    </Link>
                </div>
                <div className="pt-4 pb-3 border-t border-gray-200">
                    <div className="px-2">
                        <WalletConnect />
                    </div>
                </div>
            </div>
        </header>
    );
}

export default Header;