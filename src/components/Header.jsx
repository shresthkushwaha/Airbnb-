import React from 'react';
import { Bell, User, ChevronDown } from 'lucide-react';

const Header = () => {
    return (
        <header className="h-[86px] bg-white border-b border-gray-100 px-6 lg:px-12 flex items-center justify-between sticky top-0 z-50">
            <div className="flex items-center gap-2.5">
                <img src="/airbnb-logo.png" alt="Airbnb Logo" className="h-[34px] w-auto object-contain" />
                <span className="text-[17px] font-[800] text-[#222222] tracking-tight">Listing Media Manager</span>
            </div>

            <div className="flex items-center gap-6">
                <button className="text-gray-600 hover:bg-gray-50 p-2 rounded-full transition-colors relative">
                    <Bell className="w-[18px] h-[18px]" strokeWidth={2} />
                    <span className="absolute top-[9px] right-[9px] w-[6px] h-[6px] bg-[#FF385C] rounded-full border border-white"></span>
                </button>

                <div className="flex items-center gap-2.5 pl-2.5 pr-2 py-1.5 border border-[#dddddd] rounded-full hover:shadow-[0_2px_4px_rgba(0,0,0,0.08)] transition-shadow cursor-pointer bg-white">
                    <div className="w-[30px] h-[30px] bg-[#717171] rounded-full flex items-center justify-center overflow-hidden">
                        <User className="w-[20px] h-[20px] text-white mt-1" strokeWidth={1.5} />
                    </div>
                    <span className="text-[14px] font-[500] text-[#222222]">Host Dashboard</span>
                    <ChevronDown className="w-4 h-4 text-gray-400" />
                </div>
            </div>
        </header>
    );
};

export default Header;
