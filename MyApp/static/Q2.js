
function loadQ2Chart() {
    d3.select("#chart").html("");
    d3.select("#legend").html("");
    d3.select("#title").html(`
        <h2 style='text-align: center; margin-bottom: 20px;'>Doanh số bán hàng theo Nhóm hàng</h2>
    `);
    d3.json("/visualize/").then(function(data) {
        const groupedData = d3.rollup(data, 
            items => ({
                totalRevenue: d3.sum(items, d => +d["Thành tiền"]),
                totalQuantity: d3.sum(items, d => +d["SL"])
            }),
            d => `[${d["Mã nhóm hàng"]}] ${d["Tên nhóm hàng"]}`
        );
        const dataset = Array.from(groupedData, ([group, values]) => ({
            group, 
            revenue: values.totalRevenue,
            quantity: values.totalQuantity
        })).sort((a, b) => d3.descending(a.revenue, b.revenue));

        const colorScale = d3.scaleOrdinal(d3.schemeCategory10)
            .domain(dataset.map(d => d.group));
        const margin = { top: 70, right: 100, bottom: 50, left: 250 };
        const width = 1000 - margin.left - margin.right;
        const height = dataset.length * 60;
        const svg = d3.select("#chart")
            .append("svg")
            .attr("width", width + margin.left + margin.right)
            .attr("height", height + margin.top + margin.bottom)
            .append("g")
            .attr("transform", `translate(${margin.left}, ${margin.top})`);
        svg.append("text")
            .attr("x", width / 2)
            .attr("y", -30)
            .attr("text-anchor", "middle")
            .style("font-size", "20px")
            .style("font-weight", "bold")
            .style("fill", "#333")
            .text("Doanh số bán hàng theo Nhóm hàng");

        const yScale = d3.scaleBand()
            .domain(dataset.map(d => d.group))
            .range([0, height])
            .padding(0.2);

        const xScale = d3.scaleLinear()
            .domain([0, Math.ceil(d3.max(dataset, d => d.revenue) / 100000000) * 100000000])
            .range([0, width]);

        svg.append("g")
            .call(d3.axisLeft(yScale).tickSize(0).tickPadding(10))
            .attr("class", "axis-label");

        svg.append("g")
            .attr("transform", `translate(0, ${height})`)
            .call(d3.axisBottom(xScale).ticks(5).tickFormat(d => d3.format(".2s")(d).replace(/G/, 'B').replace(/M/, 'M')));

        const tooltip = d3.select("body").append("div")
            .style("position", "absolute")
            .style("background", "rgba(0, 0, 0, 0.8)")
            .style("color", "#fff")
            .style("padding", "8px")
            .style("border-radius", "5px")
            .style("font-size", "12px")
            .style("visibility", "hidden");

   
        svg.selectAll(".bar")
            .data(dataset)
            .enter()
            .append("rect")
            .attr("class", "bar")
            .attr("y", d => yScale(d.group))
            .attr("width", d => xScale(d.revenue))
            .attr("height", yScale.bandwidth())
            .attr("fill", d => colorScale(d.group))
            .on("mouseover", function(event, d) {
                tooltip.style("visibility", "visible")
                    .html(`
                        <strong>Nhóm hàng:</strong> ${d.group}<br>
                        <strong>Doanh số bán:</strong> ${d3.format(",")(d.revenue)} VND<br>
                        <strong>Số lượng bán:</strong> ${d3.format(",")(d.quantity)} SKUs<br>
                    `);
            })
            .on("mousemove", function(event) {
                tooltip.style("top", `${event.pageY - 10}px`)
                    .style("left", `${event.pageX + 10}px`);
            })
            .on("mouseout", function() {
                tooltip.style("visibility", "hidden");
            });

        svg.selectAll(".label")
            .data(dataset)
            .enter()
            .append("text")
            .attr("x", d => xScale(d.revenue) + 5)
            .attr("y", d => yScale(d.group) + yScale.bandwidth() / 2)
            .attr("dy", "0.35em")
            .text(d => d3.format(",.0f")(d.revenue / 1000000) + " triệu VND")
            .style("font-size", "10px")
            .style("fill", "black");
    });
}