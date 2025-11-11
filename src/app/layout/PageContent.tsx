import Header from "./Header"
import { Outlet } from "react-router-dom";


function PageContent(){
    return(
        <div className="bg-base-200 flex flex-col min-h-screen">
            <Header/>
            <main className="flex-1 overflow-y-auto z-10 bg-base-200 h-full bg-contentBg dark:bg-contentBg">
                <div className="bg-contentBg dark:bg-contentBg h-full w-full p-4 bg-base-100 mt-1 h-full">
                    <Outlet />
                </div>
            </main>
        </div> 
    )
}


export default PageContent
