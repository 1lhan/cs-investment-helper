export default function ToolTip({ content, hideArrow = true, joinString }) {
    const formattedContent = Array.isArray(content) && content.map(item => item.join(joinString))

    return (
        <div className="tool-tip">
            {!hideArrow && <span className="arrow" />}
            <div className="content">
                {Array.isArray(content) ?
                    formattedContent.map((item, index) =>
                        <span key={index}>{item}</span>
                    )
                    :
                    <span>{content}</span>
                }
            </div>
        </div>

    )
}

// <ToolTip content={ } hideArrow={ } joinString="" />