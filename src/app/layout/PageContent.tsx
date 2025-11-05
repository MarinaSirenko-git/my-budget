import Header from "./Header"
import { Outlet } from "react-router-dom";


function PageContent(){
    return(
        <div className="bg-base-200 flex flex-col">
            <Header/>
            <main className="flex-1 overflow-y-auto z-10 bg-base-200 h-full bg-gray-100 dark:bg-[#0F172A]">
                <div className="bg-white dark:bg-[#1E293B] h-full w-full p-4 bg-base-100 shadow-xl mt-1 min-h-screen">
                    <Outlet />
                </div>
            </main>
        </div> 
    )
}


export default PageContent
