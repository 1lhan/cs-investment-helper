export default function ToolTip({ content }) {

    return (
        <div className="tool-tip">
            <span className="arrow" />
            <div className="tool-tip-body">
                {Array.isArray(content) ?
                    content.map((item, index) => {
                        return Array.isArray(item) ?
                            <div key={index}>
                                <span>{item[0]}</span>
                                <span>{item[0] == "volume" ? item[1].toLocaleString(navigator.language) : item[1]}</span>
                            </div>
                            :
                            <span key={index}>{item}</span>
                    })
                    :
                    <span>{content}</span>
                }
            </div>
        </div>
    )
}

// <ToolTip content="" />