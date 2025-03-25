
function loadQ1Chart() {
    d3.select("#chart").html("");
    d3.select("#legend").html("");
    d3.select("#title").html("<h2 style='text-align: center; margin-bottom: 20px;'>Doanh số bán hàng theo Mặt hàng</h2>");

    d3.json("/visualize/").then(function(data) {
        let processedData = [];
        let categorySet = new Set();

        data.forEach(d => {
            let itemKey = `[${d["Mã mặt hàng"]}] ${d["Tên mặt hàng"]}`;
            let groupKey = `[${d["Mã nhóm hàng"]}] ${d["Tên nhóm hàng"]}`;
            let existingEntry = processedData.find(e => e.item === itemKey);

            if (existingEntry) {
                existingEntry.revenue += +d["Thành tiền"];
                existingEntry.quantity += +d["SL"];
            } else {
                processedData.push({ item: itemKey, group: groupKey, revenue: +d["Thành tiền"], quantity: +d["SL"] });
            }

            categorySet.add(groupKey);
        });

        processedData.sort((a, b) => b.revenue - a.revenue);

        const colorScale = d3.scaleOrdinal(d3.schemeCategory10)
            .domain(Array.from(categorySet));

        const margin = { top: 80, right: 250, bottom: 50, left: 300 };
        const width = 1200 - margin.left - margin.right;
        const height = processedData.length * 30 + 50;

        const svg = d3.select("#chart")
            .append("svg")
            .attr("width", width + margin.left + margin.right)
            .attr("height", height + margin.top + margin.bottom)
            .append("g")
            .attr("transform", `translate(${margin.left}, ${margin.top})`);

        svg.append("text")
            .attr("x", width / 2)
            .attr("y", -40)
            .attr("text-anchor", "middle")
            .style("font-size", "20px")
            .style("font-weight", "bold")
            .style("fill", "#333")
            .text("Doanh số bán hàng theo Mặt hàng");

        const yScale = d3.scaleBand()
            .domain(processedData.map(d => d.item))
            .range([0, height - 50])
            .padding(0.2);

        const xScale = d3.scaleLinear()
            .domain([0, d3.max(processedData, d => d.revenue) * 1.1])
            .range([0, width]);

        svg.append("g")
            .call(d3.axisLeft(yScale).tickSize(0).tickPadding(10))
            .attr("class", "axis-label");

        svg.append("g")
            .attr("transform", `translate(0, ${height - 50})`)
            .call(d3.axisBottom(xScale).ticks(5).tickFormat(d3.format(".2s")));

        const tooltip = d3.select("body").append("div")
            .style("position", "absolute")
            .style("background", "#000")
            .style("color", "#fff")
            .style("padding", "6px")
            .style("border-radius", "5px")
            .style("font-size", "12px")
            .style("visibility", "hidden");

        svg.selectAll(".bar")
            .data(processedData)
            .enter()
            .append("rect")
            .attr("class", "bar")
            .attr("y", d => yScale(d.item))
            .attr("width", d => xScale(d.revenue))
            .attr("height", yScale.bandwidth())
            .attr("fill", d => colorScale(d.group))
            .on("mouseover", function(event, d) {
                tooltip.style("visibility", "visible")
                    .html(`
                        <strong>Mặt hàng:</strong> ${d.item}<br>
                        <strong>Nhóm hàng:</strong> ${d.group}<br>
                        <strong>Doanh số:</strong> ${d3.format(",")(d.revenue)} VND<br>
                        <strong>Số lượng:</strong> ${d3.format(",")(d.quantity)} SKUs
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
            .data(processedData)
            .enter()
            .append("text")
            .attr("x", d => xScale(d.revenue) + 5)
            .attr("y", d => yScale(d.item) + yScale.bandwidth() / 2)
            .attr("dy", "0.35em")
            .text(d => `${d3.format(",.0f")(d.revenue / 1000000)} triệu VND`)
            .style("font-size", "12px")
            .style("fill", "#000");

        const legendContainer = d3.select("#legend")
            .style("display", "block")
            .style("padding", "10px")
            .style("border", "1px solid #ccc")
            .style("background", "#f9f9f9")
            .style("width", "200px");

        legendContainer.append("div")
            .style("font-weight", "bold")
            .style("margin-bottom", "5px")
            .text("Nhóm hàng");

        const legend = legendContainer.selectAll(".legend-item")
            .data(colorScale.domain())
            .enter()
            .append("div")
            .attr("class", "legend-item")
            .style("display", "flex")
            .style("align-items", "center")
            .style("margin", "5px 0");

        legend.append("div")
            .style("width", "18px")
            .style("height", "18px")
            .style("background-color", d => colorScale(d))
            .style("margin-right", "8px");

        legend.append("span").text(d => d);
    });
}
