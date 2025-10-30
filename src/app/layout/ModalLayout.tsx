function ModalLayout(){

    return(
        <>
            <div className={`modal`}>
            <div className={`modal-box`}>
                <button className="btn btn-sm btn-circle absolute right-2 top-2">✕</button>
                <h3 className="font-semibold text-2xl pb-6 text-center">Title</h3>
            </div>
            </div>
            </>
    )
}

export default ModalLayout