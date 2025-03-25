
function loadQ7Chart() {     
    d3.select("#chart").html("");
    d3.select("#legend").html("");

    d3.json("/visualize/").then(function(rawData) {
        const totalUniqueOrders = new Set(rawData.map(record => record["Mã đơn hàng"])).size; 

      
        const salesProbabilityByCategory = d3.rollup(
            rawData,
            (groupedData) => {
                const distinctOrderCount = new Set(groupedData.map(record => record["Mã đơn hàng"])).size;

                return {
                    probability: distinctOrderCount / totalUniqueOrders, 
                    orderCount: distinctOrderCount 
                };
            },
            record => `[${record["Mã nhóm hàng"]}] ${record["Tên nhóm hàng"]}`
        );

        const formattedData = Array.from(salesProbabilityByCategory, ([category, stats]) => ({
            categoryName: category,
            salesProbability: stats.probability,
            formattedProbability: (stats.probability * 100).toFixed(1) + "%", 
            totalOrders: stats.orderCount, 
        })).sort((a, b) => d3.descending(a.salesProbability, b.salesProbability));

        const margin = { top: 50, right: 50, bottom: 50, left: 300 }, 
              width  = 900 - margin.left - margin.right,
              height = formattedData.length * 60; 

        const svg = d3.select("#chart").append("svg")
                      .attr("width", width + margin.left + margin.right)
                      .attr("height", height + margin.top + margin.bottom)
                      .append("g")
                      .attr("transform", `translate(${margin.left},${margin.top})`);

       
        svg.append("text")
           .attr("x", width / 2)
           .attr("y", -30) 
           .attr("text-anchor", "middle")
           .style("font-size", "20px")
           .style("font-weight", "bold")
           .style("fill", "#333")
           .text("Xác suất bán hàng theo Nhóm hàng");

        const yScale = d3.scaleBand().domain(formattedData.map(d => d.categoryName)).range([0, height]).padding(0.2);
        const xScale = d3.scaleLinear().domain([0, d3.max(formattedData, d => d.salesProbability)]).nice().range([0, width]);

        const colorScale = d3.scaleOrdinal(d3.schemeTableau10).domain(formattedData.map(d => d.categoryName));

   
        const tooltip = d3.select("body").append("div")
            .style("position", "absolute")
            .style("background", "rgba(0, 0, 0, 0.8)")
            .style("color", "#fff")
            .style("padding", "6px")
            .style("border-radius", "5px")
            .style("font-size", "12px")
            .style("visibility", "hidden");

        
        svg.append("g")
           .call(d3.axisLeft(yScale).tickSize(0).tickPadding(10))
           .attr("class", "axis-label");

     
        svg.append("g")
           .attr("transform", `translate(0, ${height})`)
           .call(d3.axisBottom(xScale).ticks(5).tickFormat(d => (d * 100).toFixed(1) + "%"));

     
        svg.selectAll(".bar")
           .data(formattedData)
           .enter().append("rect")
           .attr("class", "bar")
           .attr("y", d => yScale(d.categoryName))
           .attr("width", d => xScale(d.salesProbability))
           .attr("height", yScale.bandwidth())
           .attr("fill", d => colorScale(d.categoryName))
           .on("mouseover", function(event, d) {
               tooltip.style("visibility", "visible")
                   .html(` 
                       <strong>Nhóm hàng:</strong> ${d.categoryName}<br>
                       <strong>Số lượng đơn bán:</strong> ${d3.format(",")(d.totalOrders)}<br>  
                       <strong>Xác suất bán:</strong> ${d.formattedProbability}<br>
                   `);
           })
           .on("mousemove", function(event) {
               tooltip.style("top", `${event.pageY - 10}px`)
                   .style("left", `${event.pageX + 10}px`);
           })
           .on("mouseout", function() {
               tooltip.style("visibility", "hidden");
           });

      
        svg.selectAll(".bar-label")
           .data(formattedData)
           .enter().append("text")
           .attr("class", "bar-label")
           .attr("x", d => xScale(d.salesProbability) + 5)
           .attr("y", d => yScale(d.categoryName) + yScale.bandwidth() / 2)
           .attr("dy", "0.35em")
           .text(d => d.formattedProbability)
           .style("font-size", "12px")
           .style("fill", "black");
    }).catch(error => console.error("Lỗi khi tải dữ liệu:", error));
}
