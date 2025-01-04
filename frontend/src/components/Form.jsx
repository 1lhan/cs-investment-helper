import { useRef } from 'react'
import { splitCamelCase } from '../utils'
import Bubbles from './Bubbles'

export default function Form({ title, submitFunction, onClickCloseBtn, formMsgState, submitBtnInnerText, labelSplitCamelCase = true, fields }) {
    const submitBtn = useRef(null)

    const _onSubmit = async (e) => {
        e.preventDefault()
        submitBtn.current.disabled = true
        await submitFunction(e)
        if (submitBtn.current) submitBtn.current.disabled = false
    }

    const renderField = (field) => {
        const { name, type, defaultValue, isStepAllowed } = field
        const inputProps = { name, type, defaultValue: defaultValue || '', ...(type == 'number' && isStepAllowed && { step: '0.01' }) }

        if (['text', 'email', 'date', 'number'].includes(type)) return <input {...inputProps} />
        else if (type == 'password') {
            return <div className="input-wrapper">
                <input {...inputProps} />
                <input id={`${name}-cb`} type="checkbox" onChange={(e) => document.querySelector(`input[name="${name}"]`).type = e.target.checked ? 'text' : 'password'} />
                <label htmlFor={`${name}-cb`}>
                    <i className="fa-regular fa-eye" />
                </label>
                <label htmlFor={`${name}-cb`}>
                    <i className="fa-regular fa-eye-slash" />
                </label>
            </div>
        }
    }

    const FormMsg = () => (formMsgState?.value && <span className="form-msg">{formMsgState.value}</span>)

    return (
        <form onSubmit={_onSubmit}>
            {title &&
                <div className="form-header" style={onClickCloseBtn ? undefined : { justifyContent: 'center' }}>
                    <span className="title">{title}</span>
                    {onClickCloseBtn && <i className="close-btn fa-solid fa-xmark" onClick={() => onClickCloseBtn()} />}
                </div>
            }
            <div className="form-body">
                {fields.map(({ align, fields }, fieldsGroupIndex) =>
                    <div className={'fields-group' + (align ? ` ${align}` : '')} key={fieldsGroupIndex}>
                        {fields.map((field, fieldIndex) =>
                            <div className="fields-group-item" key={fieldIndex}>
                                <span>{labelSplitCamelCase ? splitCamelCase(field.name) : field.name}</span>
                                {renderField(field)}
                            </div>
                        )}
                    </div>
                )}
            </div>
            <FormMsg />
            <button ref={submitBtn} className="btn" type="submit">
                <span>{submitBtnInnerText}</span>
                <Bubbles />
            </button>
        </form>
    )
}

// <Form title="" submitFunction={null} onClickCloseBtn={null} formMsgState={null} submitBtnInnerText="" labelSplitCamelCase={false} fields={[{ align: 'row', fields: [{ name: 'username', type: 'text' }] }]} />