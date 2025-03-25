function loadQ4Chart() {
    d3.select("#chart").html("");
    d3.select("#legend").html("");

    d3.json("/visualize/")
        .then(data => {
            const weekdays = ["Thứ Hai", "Thứ Ba", "Thứ Tư", "Thứ Năm", "Thứ Sáu", "Thứ Bảy", "Chủ Nhật"];

            const getWeekday = dateStr => {
                let dayIndex = new Date(dateStr).getDay();
                return weekdays[dayIndex === 0 ? 6 : dayIndex - 1];
            };

            data.forEach(entry => entry["Ngày trong tuần"] = getWeekday(entry["Thời gian tạo đơn"]));

            let salesData = weekdays.map(day => {
                let filteredData = data.filter(entry => entry["Ngày trong tuần"] === day);
                let totalRevenue = d3.sum(filteredData, entry => +entry["Thành tiền"]);
                let totalUnits = d3.sum(filteredData, entry => +entry["SL"]);
                let uniqueDays = new Set(filteredData.map(entry => entry["Thời gian tạo đơn"].split(' ')[0]));
                return { 
                    day: day, 
                    avgRevenue: Math.round(totalRevenue / uniqueDays.size), 
                    avgUnits: Math.round(totalUnits / uniqueDays.size) 
                };
            });

            const padding = { top: 70, right: 50, bottom: 70, left: 100 },
                  chartWidth  = 900 - padding.left - padding.right,
                  chartHeight = 500 - padding.top - padding.bottom;

            const svgCanvas = d3.select("#chart").append("svg")
                          .attr("width", chartWidth + padding.left + padding.right)
                          .attr("height", chartHeight + padding.top + padding.bottom)
                          .append("g")
                          .attr("transform", `translate(${padding.left},${padding.top})`);

            svgCanvas.append("text")
               .attr("x", chartWidth / 2)
               .attr("y", -30)
               .attr("text-anchor", "middle")
               .style("font-size", "20px")
               .style("font-weight", "bold")
               .style("fill", "#333")
               .text("Doanh số bán hàng theo Ngày trong tuần");

            const xScale = d3.scaleBand().domain(weekdays).range([0, chartWidth]).padding(0.2),
                  yScale = d3.scaleLinear().domain([0, d3.max(salesData, d => d.avgRevenue)]).nice().range([chartHeight, 0]),
                  colorScale = d3.scaleOrdinal(d3.schemeCategory10).domain(weekdays);

            const tooltipBox = d3.select("body").append("div")
                .style("position", "absolute")
                .style("background", "rgba(0, 0, 0, 0.8)")
                .style("color", "#fff")
                .style("padding", "6px")
                .style("border-radius", "5px")
                .style("font-size", "12px")
                .style("visibility", "hidden");

            svgCanvas.append("g")
               .attr("class", "axis x-axis")
               .attr("transform", `translate(0,${chartHeight})`)
               .call(d3.axisBottom(xScale))
               .selectAll("text")
               .style("text-anchor", "middle");

            svgCanvas.append("g")
               .attr("class", "axis y-axis")
               .call(d3.axisLeft(yScale).ticks(6).tickFormat(d => d3.format(",.0f")(d / 1e6) + "M"));

            svgCanvas.selectAll(".bar")
               .data(salesData)
               .enter().append("rect")
               .attr("class", "bar")
               .attr("x", d => xScale(d.day))
               .attr("y", d => yScale(d.avgRevenue))
               .attr("width", xScale.bandwidth())
               .attr("height", d => chartHeight - yScale(d.avgRevenue))
               .attr("fill", d => colorScale(d.day))
               .on("mouseover", (event, d) => {
                   tooltipBox.style("visibility", "visible")
                       .html(`
                           <strong>Ngày:</strong> ${d.day}<br>
                           <strong>Doanh số bán:</strong> ${d3.format(",")(d.avgRevenue)} VND<br>
                           <strong>Trung bình số lượng bán:</strong> ${d3.format(",")(d.avgUnits)} SKUs
                       `);
               })
               .on("mousemove", event => {
                   tooltipBox.style("top", `${event.pageY - 10}px`)
                          .style("left", `${event.pageX + 10}px`);
               })
               .on("mouseout", () => tooltipBox.style("visibility", "hidden"));

            svgCanvas.selectAll(".bar-label")
               .data(salesData)
               .enter().append("text")
               .attr("class", "bar-label")
               .attr("x", d => xScale(d.day) + xScale.bandwidth() / 2)
               .attr("y", d => yScale(d.avgRevenue) - 10)
               .attr("text-anchor", "middle")
               .style("font-size", "9px")
               .text(d => d3.format(",.0f")(d.avgRevenue) + " VND");
        })
        .catch(error => console.error("Lỗi khi đọc dữ liệu:", error));
}
