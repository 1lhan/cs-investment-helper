import { useSignal } from "@preact/signals-react"

export default function MultipleValueColumnChart({ data, title, keys, toolTipKeys, colors }) {
    const topPoints = useSignal(false) // object

    const chartHandler = () => {
        let _topPoints = {}

        for (let i in keys) {
            let _topPoint = data.slice().map(item => { return item[keys[i]] }).sort((a, b) => b - a)[0] * 1.25
            _topPoints[keys[i]] = _topPoint
        }
        topPoints.value = _topPoints
    }
    chartHandler()

    return (
        topPoints.value && <div className="multiple-value-column-chart">
            <div className="chart-header">
                <span className="title">{title}</span>
                <div className="chart-color-info-div">
                    {colors.map((color, colorIndex) =>
                        <div className="chart-color-info-div-item" key={colorIndex}>
                            <span style={{ background: color }} />
                            <span>{keys[colorIndex].includes('-') ? keys[colorIndex].replaceAll('-', ' ') : keys[colorIndex]}</span>
                        </div>
                    )}
                </div>
            </div>
            <div className="chart-body">
                {data.map((dataItem, index) =>
                    <div key={index} style={{ width: (100 / data.length) + '%' }} className="value-wrapper">
                        {keys.map((key, keyIndex) =>
                            <div className="value" style={{ width: '50%', height: ((dataItem[key] / topPoints.value[key]) * 100) + '%', background: colors[keyIndex] }} key={keyIndex} />
                        )}
                        <div className="tool-tip" style={{ left: index < data.length / 2 ? '0' : '', right: index > data.length / 2 ? '0' : '' }}>
                            {toolTipKeys.map((toolTipKey, toolTipIndex) =>
                                <span className="tool-tip-item" key={toolTipIndex}>
                                    <span>{toolTipKey.includes('-') ? toolTipKey.replaceAll('-', ' ') : toolTipKey}</span>
                                    <span>{dataItem[toolTipKey]}</span>
                                </span>
                            )}
                        </div>
                    </div>
                )}
            </div>
        </div>
    )
}