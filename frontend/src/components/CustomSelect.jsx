import { splitCamelCase } from "../utils"

export default function CustomSelect({ id, title, state, func, options }) {
    const checkBoxId = (id || title.toLowerCase()) + '-cb'

    const onClickOption = (value) => {
        state.value = value
        document.getElementById(checkBoxId).checked = false
        if (func) func()
    }

    return (
        <div className="custom-select">
            <input id={checkBoxId} type="checkbox" />
            <label htmlFor={checkBoxId}>
                <span className="title">{title}</span>
                <span className="hidden">{[title, ...options].slice().sort((a, b) => b.length - a.length)[0]}</span>
                <span className="state-value">{splitCamelCase(state.value)}</span>
                <i className="fa-solid fa-chevron-down" />
            </label>
            <div className="options">
                {['Any', ...options].map((option, optionIndex) =>
                    <button onClick={(() => onClickOption(option))} disabled={state == option} key={optionIndex}>
                        {splitCamelCase(option)}
                    </button>
                )}
            </div>
        </div>
    )
}

// <CustomSelect id="" title="" state={ } func={ } options={ } />