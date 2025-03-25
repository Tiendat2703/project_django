
function loadQ8Chart() {     
    d3.select("#chart").html("");
    d3.select("#legend").html("");

    d3.json("/visualize/").then(function(rawData) {
        const parseDateTime = d3.timeParse("%Y-%m-%d %H:%M:%S");

  
        const monthlyOrderCount = d3.rollup(
            rawData,
            (entries) => new Set(entries.map(record => record["Mã đơn hàng"])).size,
            (record) => d3.timeFormat("%Y-%m")(parseDateTime(record["Thời gian tạo đơn"])) 
        );

        const salesProbabilityByCategory = d3.rollup(
            rawData,
            (entries) => {
                const monthKey = d3.timeFormat("%Y-%m")(parseDateTime(entries[0]["Thời gian tạo đơn"]));
                const distinctOrders = new Set(entries.map(record => record["Mã đơn hàng"])).size;
                return {
                    probability: distinctOrders / monthlyOrderCount.get(monthKey),
                    totalOrders: distinctOrders 
                };
            },
            (record) => d3.timeFormat("%Y-%m")(parseDateTime(record["Thời gian tạo đơn"])),
            (record) => `[${record["Mã nhóm hàng"]}] ${record["Tên nhóm hàng"]}`
        );

        let formattedData = [];
        salesProbabilityByCategory.forEach((categories, month) => {
            categories.forEach((metrics, category) => {
                formattedData.push({
                    month: month,
                    monthLabel: `Tháng ${String(month.split('-')[1]).padStart(2, "0")}`,
                    category: category,
                    probability: metrics.probability,
                    probabilityFormatted: (metrics.probability * 100).toFixed(1) + "%", 
                    totalOrders: metrics.totalOrders
                });
            });
        });

        formattedData.sort((a, b) => d3.ascending(a.month, b.month));

        const margin = { top: 50, right: 250, bottom: 50, left: 100 },
              chartWidth  = 1200 - margin.left - margin.right,
              chartHeight = 500 - margin.top - margin.bottom;

        const svg = d3.select("#chart").append("svg")
                      .attr("width", chartWidth + margin.left + margin.right)
                      .attr("height", chartHeight + margin.top + margin.bottom)
                      .append("g")
                      .attr("transform", `translate(${margin.left},${margin.top})`);

   
        svg.append("text")
           .attr("x", chartWidth / 2)
           .attr("y", -20)
           .attr("text-anchor", "middle")
           .style("font-size", "20px")
           .style("font-weight", "bold")
           .style("fill", "#333")
           .text("Xác suất bán hàng của Nhóm hàng theo Tháng");

        const xScale = d3.scalePoint().domain([...new Set(formattedData.map(d => d.monthLabel))]).range([0, chartWidth]).padding(0.5);
        const yScale = d3.scaleLinear().domain([0, d3.max(formattedData, d => d.probability)]).nice().range([chartHeight, 0]);

        const colorScale = d3.scaleOrdinal(d3.schemeTableau10).domain([...new Set(formattedData.map(d => d.category))]);


        const groupedData = d3.groups(formattedData, d => d.category);

 
        const tooltip = d3.select("body").append("div")
            .style("position", "absolute")
            .style("background", "rgba(0, 0, 0, 0.8)")
            .style("color", "#fff")
            .style("padding", "6px")
            .style("border-radius", "5px")
            .style("font-size", "12px")
            .style("visibility", "hidden");

   
        groupedData.forEach(([category, dataPoints]) => {
            const lineGenerator = d3.line()
                .x(d => xScale(d.monthLabel))
                .y(d => yScale(d.probability));

            svg.append("path")
                .datum(dataPoints)
                .attr("fill", "none")
                .attr("stroke", colorScale(category))
                .attr("stroke-width", 2)
                .attr("d", lineGenerator);

            const topDataPoints = dataPoints.sort((a, b) => d3.descending(a.probability, b.probability)).slice(0, 3);
            topDataPoints.forEach(point => {
                svg.append("circle")
                    .attr("cx", xScale(point.monthLabel))
                    .attr("cy", yScale(point.probability))
                    .attr("r", 5)
                    .attr("fill", colorScale(category))
                    .attr("stroke", "#fff")
                    .attr("stroke-width", 2);
            });
        });


        svg.selectAll(".dot")
           .data(formattedData)
           .enter().append("circle")
           .attr("class", "dot")
           .attr("cx", d => xScale(d.monthLabel))
           .attr("cy", d => yScale(d.probability))
           .attr("r", 4)
           .attr("fill", d => colorScale(d.category))
           .on("mouseover", function(event, d) {
               tooltip.style("visibility", "visible")
                   .html(`
                       <strong>${d.monthLabel} | Nhóm hàng: ${d.category}</strong><br>
                       <strong>SL Đơn Bán:</strong> ${d.totalOrders}<br>
                       <strong>Xác suất Bán:</strong> ${d.probabilityFormatted}
                   `);
           })
           .on("mousemove", function(event) {
               tooltip.style("top", `${event.pageY - 10}px`)
                   .style("left", `${event.pageX + 10}px`);
           })
           .on("mouseout", function() {
               tooltip.style("visibility", "hidden");
           });

        svg.append("g")
           .attr("transform", `translate(0, ${chartHeight})`)
           .call(d3.axisBottom(xScale));

        svg.append("g")
           .call(d3.axisLeft(yScale).ticks(6).tickFormat(d => (d * 100).toFixed(0) + "%"));

    }).catch(error => console.error("Lỗi khi tải dữ liệu:", error));
}