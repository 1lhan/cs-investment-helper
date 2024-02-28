export default function CustomSelect({ id, title, state, options, func, width }) {

    return (
        <div className="custom-select">
            <span className="title">{title}</span>
            <input id={id} className="custom-select-checkbox" type="checkbox" value={state.value} />
            <label htmlFor={id} style={{ width }}>
                <span className="state-value">{state.value.includes('-') ? state.value.replaceAll('-', ' ') : state}</span>
                <i className="fa-solid fa-chevron-up" />
            </label>
            <div className="options">
                {options.map((option, index) =>
                    <button onClick={() => { state.value = option; document.getElementById(id).checked = false; if (func) { func() } }} disabled={state.value == option} key={index}>
                        {option.includes('-') ? option.replaceAll('-', ' ') : option}
                    </button>
                )}
            </div>
        </div>
    )
}