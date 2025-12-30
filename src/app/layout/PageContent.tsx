import Header from "./Header"
import { Outlet } from "react-router-dom";


function PageContent(){
    return(
        <div className="flex flex-col min-h-screen">
            <Header/>
            <main className="flex-1 overflow-y-auto z-10 h-full">
                <div className="h-full w-full p-4 mt-1 h-full bg-white dark:bg-black">
                    <Outlet />
                </div>
            </main>
        </div> 
    )
}


export default PageContent
