import { useState } from "react";

export default function ColumnChart({ data, headerText, valueKey }) {
    const topPoint = +(data.slice().sort((a, b) => b[valueKey] - a[valueKey])[0][valueKey] * 1.25)
    const [toolTipValue, setToolTipValue] = useState({})

    return (
        <div className="column-chart-wrapper">
            <div className="chart-header">{headerText}</div>
            <div className="chart-body">
                {data.map((item, index) =>
                    <div key={index} style={{ width: (100 / data.length) + '%' }} className="value-wrapper">
                        <div
                            className="value" style={{ width: '50%', height: ((item[valueKey] / topPoint) * 100) + '%' }}
                            onMouseOver={() => setToolTipValue({ index, item, left: `calc(${((100 / data.length) * index) + ((100 / data.length) * 0.5)}%)` })}
                            onMouseLeave={() => setToolTipValue({})}
                        />
                    </div>
                )}

                {toolTipValue.index >= 0 &&
                    <div className="tool-tip"
                        style={{ left: toolTipValue.left, transform: toolTipValue.index < data.length / 2 ? 'translateX(0)' : 'translateX(-100%)' }}>
                        {Object.keys(toolTipValue.item).map((item, index) =>
                            <span className="tool-tip-children" key={index}>
                                <span>{item.split('-').map(item => item = item.slice(0, 1).toUpperCase() + item.slice(1)).join(' ')}</span>
                                <span>{Object.values(toolTipValue.item)[index]}</span>
                            </span>
                        )}
                    </div>
                }
            </div>
        </div >
    )
}

//