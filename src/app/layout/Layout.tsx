import PageContent from './PageContent'
import LeftSidebar from './LeftSidebar'

function Layout(){
    return(
      <>
        <div className="min-h-screen grid md:grid-cols-[clamp(200px,18vw,260px)_1fr]">
            <div className="hidden md:block">
                <LeftSidebar />
            </div>
            <PageContent/>
        </div>
      </>
    )
}

export default Layout