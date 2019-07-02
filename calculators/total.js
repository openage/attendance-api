exports.calculate = (insight, summaries) => {
    // exports.calculate = (insight, values) => {
    // summaries = [{
    //     values: [{ key: 'rose garden', value: 1 }, { key: 'kausali', value: 3 }, { key: 'shimla', value: 2 }]
    // }, {
    //     values: [{ key: 'rose garden', value: 3 }, { key: 'kausali', value: 1 }, { key: 'shimla', value: 2 }]
    // }]

    let finalValues = []

    summaries.forEach(summary => {
        summary.forEach(item => {
            let keyValue = finalValues.find(value => value.key === item.key)

            if (!keyValue) {
                keyValue = {
                    key: item.key,
                    value: 0
                }

                finalValues.push(keyValue)
            }

            keyValue.value = keyValue.value + item.value
        })
    })

    return finalValues
}
