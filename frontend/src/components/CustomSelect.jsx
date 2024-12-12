export default function CustomSelect({ id, title, state, func, options }) {

    const onClickOption = (_value) => {
        state.value = _value
        document.getElementById(`${id}-cb`).checked = false
        if (func) func()
    }

    return (
        <div className="custom-select">
            <input id={`${id}-cb`} type="checkbox" />
            <label htmlFor={`${id}-cb`}>
                <span className="state-value">{state.value.replace(/([a-z])([A-Z])/g, '$1 $2')}</span>
                <span className="hidden">{[title, ...options].slice().sort((a, b) => b.length - a.length)[0]}</span>
                <i className="fa-solid fa-chevron-down" />
                <span className="title">{title}</span>
            </label>
            <div className="options">
                {['Any', ...options].map((option, optionIndex) =>
                    <button onClick={() => onClickOption(option)} disabled={state.value == option} key={optionIndex}>
                        {option.replace(/([a-z])([A-Z])/g, '$1 $2')}
                    </button>
                )}
            </div>
        </div>
    )
}

// <CustomSelect id='event-name' title='Event Name' state={eventName} options={events.map(item => { return item.name })} func={null} />