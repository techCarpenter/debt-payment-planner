/* New Loan Entry Row Component */
Vue.component("new-loan-entry", {
  data: function () {
    return {
      loan: {
        id: 0,
        name: "",
        apr: 0,
        balance: 0,
        minPayment: 0,
      },
    };
  },
  methods: {
    raiseAdd() {
      let temp_loan = { ...this.loan };
      this.loan.id = 0;
      this.loan.name = "";
      this.loan.balance = 0;
      this.loan.apr = 0;
      this.loan.minPayment = 0;
      this.$emit("addloan", temp_loan);
    },
  },
  template: `<tr>
        <td><input type="text" v-model="loan.name" @keyup.enter="raiseAdd" /></td>
        <td><input type="number" v-model="loan.balance" min="0" step="any" @keyup.enter="raiseAdd" /></td>
        <td><input type="number" v-model="loan.apr" min="0" step="any" max="35" @keyup.enter="raiseAdd" /></td>
        <td><input type="number" v-model="loan.minPayment" min="0" step="any" @keyup.enter="raiseAdd" /></td>
        <td></td>
        <td><button @click="raiseAdd"><strong>+</strong></button></td>
  </tr>`,
});

/* Loan Item Row */
Vue.component("loan-item", {
  props: {
    loan: Object,
  },
  data: function () {
    return {
      isEditing: false,
      newLoan: {},
    };
  },
  methods: {
    raiseUpdate() {
      this.isEditing = false;
      this.$emit("updateLoan", this.newLoan);
    },
    handleEdit() {
      if (this.isEditing) {
        this.raiseUpdate();
      } else {
        this.newLoan = { ...this.loan };
        this.isEditing = true;
      }
    },
  },
  template: `<tr>
      <td v-if="!isEditing">{{loan.name}}</td>
      <td v-else @keyup.esc="isEditing=false" @keyup.enter="handleEdit"><input type="text" v-model="newLoan.name" /></td>

      <td v-if="!isEditing" style="text-align: right;">\${{loan.balance.toFixed(2)}}</td>
      <td v-else style="text-align: right;" @keyup.esc="isEditing=false" @keyup.enter="handleEdit"><input type="number" step="any" v-model="newLoan.balance" /></td>

      <td v-if="!isEditing" style="text-align: right;">{{loan.apr.toFixed(2)}}%</td>
      <td v-else style="text-align: right;" @keyup.esc="isEditing=false" @keyup.enter="handleEdit"><input type="number" min="0" step="any" v-model="newLoan.apr" /></td>

      <td v-if="!isEditing" style="text-align: right;">\${{loan.minPayment.toFixed(2)}}</td>
      <td v-else style="text-align: right;" @keyup.esc="isEditing=false" @keyup.enter="handleEdit"><input type="number" min="0" step="any" v-model="newLoan.minPayment" /></td>

      <td><button @keyup.esc="isEditing=false" @click="handleEdit">{{ isEditing ? "Commit" : "Edit" }}</button></td>
      <td><button @keyup.esc="isEditing=false" @click="$emit('destroy')">Delete</button></td>
    </tr>`,
});

/* Vue Instance */
let app = new Vue({
  el: "#app",
  data: function () {
    return {
      loans: [
        {
          id: 1,
          name: "Car Loan",
          apr: 4.3,
          balance: 6534.53,
          minPayment: 500,
        },
        {
          id: 2,
          name: "School loan",
          apr: 5.1,
          balance: 17150,
          minPayment: 189,
        },
        {
          id: 3,
          name: "Credit Card",
          apr: 17.99,
          balance: 486.53,
          minPayment: 50,
        },
      ],
      nextLoanId: 4,
      data: [],
    };
  },
  template: `
    <div>
      <table>
        <thead>
          <tr>
            <th>Account</th>
            <th>Balance</th>
            <th>Rate</th>
            <th>Min. Payment</th>
            <th></th>
            <th></th>
          </tr>
        </thead>
        <tbody>
          <tr is="loan-item" v-for="loan in loans" :key="loan.id" :loan="loan" @destroy="handleDestroy" @updateLoan="handleUpdate($event)"></tr>
          <tr is="new-loan-entry" @addloan="handleAdd"></tr>
        </tbody>
      </table>
      <div>
        <svg id="loan-graph"></svg>
      </div>
    </div>`,
  methods: {
    handleDestroy(loan) {
      const index = this.loans.indexOf(loan);
      this.loans.splice(index, 1);

      this.graphLoans();
    },
    handleAdd(newLoan) {
      newLoan.id = this.nextLoanId;
      this.nextLoanId++;

      newLoan.balance = parseFloat(newLoan.balance);
      newLoan.apr = parseFloat(newLoan.apr);
      newLoan.minPayment = parseFloat(newLoan.minPayment);

      this.loans.push(newLoan);

      this.graphLoans();
    },
    handleUpdate(loan) {
      this.loans.map((item) => {
        if (item.id === loan.id) {
          item.balance = parseFloat(loan.balance);
          item.apr = parseFloat(loan.apr);
          item.minPayment = parseFloat(loan.minPayment);
          item.name = loan.name;
        }
      });
      this.graphLoans();
    },
    graphLoans() {
      let localData = [];
      this.loans.map((loan) => {
        localData = [...localData, ...this.getPaymentData(loan)];
      });

      /* Group loan payment data by loan ID */
      let sumstat = d3
        .nest()
        .key(function (d) {
          return d.loanID;
        })
        .entries(localData);

      /* set the dimensions and margins of the graph */
      let margin = { top: 30, right: 30, bottom: 30, left: 60 },
        width = 800 - margin.left - margin.right,
        height = 400 - margin.top - margin.bottom;

      /* Remove any svg from previous charts */
      d3.select("#loan-graph > *").remove();

      /* Append the svg object to the body of the page */
      let svg = d3
        .select("#loan-graph")
        .attr("width", width + margin.left + margin.right)
        .attr("height", height + margin.top + margin.bottom)
        .append("g")
        .attr("transform", "translate(" + margin.left + "," + margin.top + ")");

      /* Add X axis (it is a date format) */
      let xScale = d3
        .scaleTime()
        .domain(
          d3.extent(localData, function (d) {
            return d.date;
          })
        )
        .range([0, width]);

      svg
        .append("g")
        .attr("transform", "translate(0," + height + ")")
        .call(d3.axisBottom(xScale));

      /* Add Y axis */
      let yScale = d3
        .scaleLinear()
        .domain([
          0,
          d3.max(localData, function (d) {
            return +d.balance;
          }),
        ])
        .range([height, 0]);
      svg.append("g").call(d3.axisLeft(yScale));

      /* list of loan group names */
      let res = sumstat.map(function (d) {
        return d.key;
      });

      let color = d3
        .scaleLinear()
        .domain(res)
        .range(["#e41a1c", "#377eb8", "#4daf4a", "#984ea3", "#ff7f00", "#ffff33", "#a65628", "#f781bf", "#999999"]);

      svg
        .selectAll(".line")
        .data(sumstat)
        .enter()
        .append("path")
        .attr("fill", "none")
        .attr("stroke", function (d) {
          return color(d.key);
        })
        .attr("stroke-width", 1.5)
        .attr("d", function (d) {
          return d3
            .line()
            .x(function (d) {
              return xScale(d.date);
            })
            .y(function (d) {
              return yScale(+d.balance);
            })(d.values);
        });

      /* Add 'curtain' rectangle to hide graph */
      svg
        .append("rect")
        .attr("x", -1 * width)
        .attr("y", -1 * height)
        .attr("height", height)
        .attr("width", width)
        .attr("class", "curtain")
        .attr("transform", "rotate(180)")
        .style("fill", "#ffffff");

      /* Animate curtain to reveal graph */
      svg.select("rect.curtain").transition().delay(500).duration(2000).attr("width", 0).ease(d3.easeCubic);
    },
    getPaymentData(loan) {
      let paymentData = [];

      let newDate = new Date(),
        curYear = newDate.getFullYear(),
        curMonth = newDate.getMonth();

      let ratePerMonth = loan.apr / 1200,
        presentValue = loan.balance,
        minPay = loan.minPayment,
        futureValue,
        curMonthInterest,
        curMonthPrincipal;

      /* Add initial balance */
      paymentData.push({
        loanID: loan.id,
        date: new Date(curYear, curMonth, 1),
        balance: presentValue,
        interestPaid: 0,
        principalPaid: 0,
      });

      while (true) {
        /* Calculate Next Payment Date */
        if (curMonth === 11) {
          curYear++;
          curMonth = 0;
        } else {
          curMonth++;
        }

        /* Calculate future value after interest accrues and payment is applied */
        curMonthInterest = presentValue * (1 + ratePerMonth) - presentValue;
        curMonthPrincipal = minPay - curMonthInterest;
        futureValue = parseFloat((presentValue + curMonthInterest - minPay).toFixed(2));

        if (futureValue >= presentValue && futureValue !== 0) {
          alert("Minimum payment will not cover interest every month.");
          break;
        }
        if (futureValue < 0) {
          curMonthPrincipal += futureValue;
          futureValue = 0;
        }
        paymentData.push({
          loanID: loan.id,
          date: new Date(curYear, curMonth, 1),
          balance: futureValue,
          interestPaid: parseFloat(curMonthInterest.toFixed(2)),
          principalPaid: parseFloat(curMonthPrincipal.toFixed(2)),
        });

        presentValue = futureValue;

        if (presentValue === 0) {
          break;
        }
      }

      return paymentData;
    },
  },
  mounted() {
    this.graphLoans();
  },
});
