import { SparklesIcon, ArrowRightEndOnRectangleIcon, ArrowRightStartOnRectangleIcon, DocumentMagnifyingGlassIcon, CreditCardIcon } from '@heroicons/react/24/solid'
import { NavLink, Link } from "react-router-dom";

function LeftSidebar(){
    const navLinkClass = ({ isActive }: { isActive: boolean }) => 
        `flex items-center gap-2 hover:bg-gray-100 p-2 dark:hover:bg-[#1E293B] hover:rounded-md ${isActive ? 'bg-gray-100 dark:bg-[#1E293B] rounded-md' : ''}`;

    return(
        <div className="h-screen flex flex-col bg-[#F1F5F9] dark:bg-[#0F172A] dark:text-white border-r dark:border-gray-800 p-2">
            <div className='py-4 px-4'>
                <Link className='flex items-center font-bold gap-2 text-xl text-[#3B82F6] dark:text-[#3B82F6]' to="/">
                <CreditCardIcon className='w-6 h-6'/>
                Budgetaizer
                </Link>
            </div>
            <ul className="menu pt-2 w-full font-base bg-base-100 h-full text-[#1E293B] dark:text-[#F8FAFC] text-md leading-loose">
                <li className="py-2 rounded-md"> 
                    <NavLink className={navLinkClass} to="/goals">
                    {/* <SparklesIcon className='w-6 h-6'/>  */}
                    My financial goals
                    </NavLink>
                </li>
                <li className="py-2 rounded-md"> 
                    <NavLink className={navLinkClass} to="/income">
                    {/* <ArrowRightEndOnRectangleIcon className='w-6 h-6'/> */}
                    My profit
                    </NavLink>
                </li>
                <li className="py-2 rounded-md"> 
                    <NavLink className={navLinkClass} to="/expenses">
                    {/* <ArrowRightStartOnRectangleIcon className='w-6 h-6'/> */}
                    My expenses
                    </NavLink>
                </li>

            </ul>
            <ul className="pt-2 w-full font-base bg-base-100 text-[#1E293B] dark:text-[#F8FAFC] text-md leading-loose">
                <li className="font-semibold rounded-md"> 
                    <NavLink className='flex items-center font-normal gap-2 py-1 px-4 hover:opacity-80' to="/docs">
                    {/* <DocumentMagnifyingGlassIcon className='w-6 h-6'/> */}
                    How to use it?
                    </NavLink>
                </li>
                <li className="font-semibold rounded-md"> 
                    <NavLink className='flex items-center font-normal gap-2 py-1 px-4 hover:opacity-80' to="/settings">
                        Settings
                    </NavLink>
                </li>
                <li className="font-semibold rounded-md"> 
                    <button className='flex items-center font-normal gap-2 py-1 px-4 hover:opacity-80'>
                        Log out
                    </button>
                </li>
            </ul>
        </div>
    )
}

export default LeftSidebar