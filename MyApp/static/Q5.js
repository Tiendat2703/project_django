function loadQ5Chart() {   
    d3.select("#chart").html("");
    d3.select("#legend").html("");

    d3.json("/visualize/").then(function(orderData) {
        function extractDay(dateStr) {
            const dateObj = new Date(dateStr);
            return `Ngày ${String(dateObj.getDate()).padStart(2, "0")}`;
        }

        orderData.forEach(order => {
            order["Ngày trong tháng"] = extractDay(order["Thời gian tạo đơn"]);
        });

        let salesDataByDay = Array.from({ length: 31 }, (_, index) => {
            let dayLabel = `Ngày ${String(index + 1).padStart(2, "0")}`;
            let dailyOrders = orderData.filter(order => order["Ngày trong tháng"] === dayLabel);
            let totalRevenue = d3.sum(dailyOrders, order => +order["Thành tiền"]);
            let totalQuantity = d3.sum(dailyOrders, order => +order["SL"]);
            let uniqueOrderDays = new Set(dailyOrders.map(order => order["Thời gian tạo đơn"].split(' ')[0]));

            let avgRevenue = uniqueOrderDays.size ? totalRevenue / uniqueOrderDays.size : 0;
            let avgQuantity = uniqueOrderDays.size ? totalQuantity / uniqueOrderDays.size : 0;

            return { 
                day: dayLabel, 
                avgRevenue: avgRevenue, 
                avgQuantity: avgQuantity 
            };
        });

        const layout = { top: 70, right: 50, bottom: 120, left: 100 },  
              chartWidth  = 1400 - layout.left - layout.right,
              chartHeight = 600 - layout.top - layout.bottom;

        const svgCanvas = d3.select("#chart").append("svg")
                      .attr("width", chartWidth + layout.left + layout.right)
                      .attr("height", chartHeight + layout.top + layout.bottom)
                      .append("g")
                      .attr("transform", `translate(${layout.left},${layout.top})`);

        svgCanvas.append("text")
           .attr("x", chartWidth / 2)
           .attr("y", -30) 
           .attr("text-anchor", "middle")
           .style("font-size", "20px")
           .style("font-weight", "bold")
           .style("fill", "#333")
           .text("Doanh số bán hàng trung bình theo Ngày trong tháng");

        const xAxisScale = d3.scaleBand().domain(salesDataByDay.map(d => d.day)).range([0, chartWidth]).padding(0.4);
        const yAxisScale = d3.scaleLinear().domain([0, d3.max(salesDataByDay, d => d.avgRevenue)]).nice().range([chartHeight, 0]);

        const colorPalette = d3.scaleOrdinal(d3.schemeTableau10).domain(salesDataByDay.map(d => d.day));

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
           .call(d3.axisBottom(xAxisScale))
           .selectAll("text")
           .attr("transform", "rotate(-30)")
           .style("text-anchor", "end")
           .style("font-size", "12px");

        svgCanvas.append("g")
           .attr("class", "axis y-axis")
           .call(d3.axisLeft(yAxisScale).ticks(6).tickFormat(d => d3.format(",.0f")(d / 1000000) + "M"));

        svgCanvas.selectAll(".bar")
           .data(salesDataByDay)
           .enter().append("rect")
           .attr("class", "bar")
           .attr("x", d => xAxisScale(d.day))
           .attr("y", d => yAxisScale(d.avgRevenue))
           .attr("width", xAxisScale.bandwidth())
           .attr("height", d => chartHeight - yAxisScale(d.avgRevenue))
           .attr("fill", d => colorPalette(d.day))
           .on("mouseover", function(event, d) {
               tooltipBox.style("visibility", "visible")
                   .html(` 
                       <strong>Ngày:</strong> ${d.day}<br>
                       <strong>Doanh số bán:</strong> ${d3.format(".1f")(d.avgRevenue / 1000000)} triệu VND<br>
                       <strong>Trung bình số lượng bán:</strong> ${d3.format(",")(Math.round(d.avgQuantity))} SKUs<br>
                   `);
           })
           .on("mousemove", function(event) {
               tooltipBox.style("top", `${event.pageY - 10}px`)
                   .style("left", `${event.pageX + 10}px`);
           })
           .on("mouseout", function() {
               tooltipBox.style("visibility", "hidden");
           });

        svgCanvas.selectAll(".bar-label")
           .data(salesDataByDay)
           .enter().append("text")
           .attr("class", "bar-label")
           .attr("x", d => xAxisScale(d.day) + xAxisScale.bandwidth() / 2)
           .attr("y", d => yAxisScale(d.avgRevenue) - 10)
           .attr("text-anchor", "middle")
           .style("font-size", "12px")
           .style("fill", "black")
           .text(d => d3.format(".1f")(d.avgRevenue / 1000000) + " tr");
    }).catch(error => console.error("Lỗi khi đọc dữ liệu:", error));
}
