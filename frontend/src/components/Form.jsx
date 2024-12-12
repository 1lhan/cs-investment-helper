export default function Form({ title, submitFunction, onClickCloseBtn, fields, formMsgState, submitBtnInnerText }) {
    const _onSubmit = async (e) => {
        e.preventDefault()
        submitFunction(e)
    }

    const fieldsGroupItemInputRenderHandler = (field) => {
        const { name, type, defaultValue } = field

        if (['text', 'email', 'date'].includes(type)) return <input name={name} type={type} defaultValue={defaultValue || ''} />
        else if (type == 'number') return <input name={name} type={type} defaultValue={defaultValue || ''} step={'0.0001'} />
        else if (type == 'password') return <div className="input-wrapper">
            <input name={name} type={type} />
            <input id={`${name}-cb`} type="checkbox" onChange={(e) => document.querySelector(`input[name="${name}"]`).type = e.target.checked ? 'text' : 'password'} />
            <label htmlFor={`${name}-cb`}>
                <i className="fa-regular fa-eye" />
            </label>
            <label htmlFor={`${name}-cb`}>
                <i className="fa-regular fa-eye-slash" />
            </label>
        </div>
    }

    const FormMsg = () => {
        return (
            <>
                {formMsgState.value && <span className="form-msg">{formMsgState}</span>}
            </>
        )
    }

    return (
        <form className="form" onSubmit={_onSubmit}>
            {title && <div className="form-header" style={{ ...(!onClickCloseBtn) && { justifyContent: 'center' } }}>
                <h2>{title}</h2>
                {onClickCloseBtn && <i className="fa-solid fa-xmark" onClick={() => onClickCloseBtn()} />}
            </div>}
            <div className="form-body">
                {fields.map(({ align, fields }, fieldsGroupIndex) =>
                    <div className={"fields-group" + (align ? ` ${align}` : '')} key={fieldsGroupIndex}>
                        {fields.map((field, fieldIndex) =>
                            <div className="fields-group-item" key={fieldIndex}>
                                <span>{field.name.replace(/([a-z])([A-Z])/g, '$1 $2')}</span>
                                {fieldsGroupItemInputRenderHandler(field)}
                            </div>
                        )}
                    </div>
                )}
            </div>
            <FormMsg />
            <button className="btn" type="submit">{submitBtnInnerText}</button>
        </form>
    )
}

// <Form title='' submitFunction={null} onClickCloseBtn={null} formMsgState={null} submitBtnInnerText='' fields={[{ align: 'row', fields: [{ name: 'username', type: 'text' }] }]} />