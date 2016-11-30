var amountBorrowed = 500;
var studyType = 'undegraduate';
var creditQuality = 'ok';
var loanTerm = 1;
var apr;
var baseRate = 0.099;

$(document).ready(function() {
    //admin

    $(".admin").hide();

    $("#baseRate").val(9.9);
    // public
    $('#undergrad').prop('checked', true);
    $("#ok").prop('checked', true);
    $("#kreditVrednost").html("500 €");
    $("#dobaOdplacilaVrednost").html("1 leto");
    getValues();
    $("#visinaKredita").slider({
        value: 500,
        min: 500,
        max: 40000,
        step: 500,
        slide: function(event, ui) {
            $("#kreditVrednost").html(ui.value + " €");
            amountBorrowed = ui.value;
            getValues();
        }
    });

    $("#dobaOdplacila").slider({
        value:1,
        min:1,
        max:10,
        step:1,
        slide: function(evemt, ui) {
            $("#dobaOdplacilaVrednost").html(leta(ui.value));
            loanTerm = ui.value;
            getValues();
        } 
    });

    $(".studij").checkboxradio({
        icon: false
    });

    $(".studij").on('change', function() {
        studyType = $('.studij:checked').val();
        getValues();
    });



    $(".sposobnost").checkboxradio({
        icon: false
    });

    $(".sposobnost").on('change', function() {
        creditQuality = $('.sposobnost:checked').val();
        getValues();
    });

    $("#baseRate").on("input", function() {
        baseRate = ($("#baseRate").val())/100;
        console.log(baseRate);
        getValues();
    })

});

function toggleAdmin(e) {
    $(".admin").toggle();
}

function getValues() {
    calc({
        'studyType': studyType,
        'loanTerm': loanTerm,
        'amountBorrowed': amountBorrowed,
        'creditQuality': creditQuality
    })
}

function calc(arg) {
    var study_type = arg.studyType,
        credit_quality = arg.creditQuality,
        loan_term = arg.loanTerm,
        amount_borrowed = arg.amountBorrowed,
        apr = arg.apr,
        orig_fee = arg.originationFee || 0.065;

    var rows = [],
        paid_int = 0,
        paid_all = 0,
        balance_EOP = 0,
        post_study_pmnt = 0;

    // hidden system input (constants)
    var MONTHS_TO_GRAD = arg.monthToGrad || 9,
        MONTHS_GRACE = 3,
        BASE_RATE = baseRate, // used to be 0.1
        RATE_DIFF_IN_STUDY = 0.02,
        IN_STUDY_PMNT_PERCENT = 0.75,
        IN_STUDY_PMNT_ROUND = 5,
        IN_STUDY_PMNT_MAX = 75,

        loan_length_months = MONTHS_TO_GRAD + MONTHS_GRACE + loan_term * 12,
        month_full_repay_start = MONTHS_TO_GRAD + MONTHS_GRACE + 1,
        post_study_rate = BASE_RATE;


    //if(credit_quality == 'ok'){
    //  post_study_rate = post_study_rate;          // FIXME: pointless
    //}
    if(credit_quality == 'good'){
        post_study_rate -= 0.02;                      //TODO: magic
    }
    else if(credit_quality == 'notGreat'){
        post_study_rate += 0.02;
    }

    //if(study_type == 'Undergrad'){
    //    post_study_rate = post_study_rate;          // FIXME: pointless
    //}
    if (study_type == 'postgrad'){
        post_study_rate = post_study_rate - 0.02;
    }

    if(arg.interestRate){
      post_study_rate = arg.interestRate;
    }

    var in_study_rate = post_study_rate + RATE_DIFF_IN_STUDY;

    var in_study_pmnt =
        parseFloat((

            Math.floor(
                ( (in_study_rate / 12) * ((orig_fee * amount_borrowed) + amount_borrowed) * IN_STUDY_PMNT_PERCENT / IN_STUDY_PMNT_ROUND )
            ) * IN_STUDY_PMNT_ROUND

        ).toFixed(2)) || 5;

    if (in_study_pmnt > IN_STUDY_PMNT_MAX){
        in_study_pmnt = IN_STUDY_PMNT_MAX
    }

    for (var i = 0; i <= loan_length_months; i++) {

        var row = {};
        row.month = i;

        if(i == loan_length_months){
            row.prepaid = balance_EOP;
        } else {
            row.prepaid = 0;
        }

        if(i == month_full_repay_start){
            post_study_pmnt = parseFloat((
                ( (post_study_rate / 12) * balance_EOP ) / (1 - (   Math.pow((1 + (post_study_rate / 12)), (loan_term * -12))   ))
            ).toFixed(2));

        } else if (i == loan_length_months){
            post_study_pmnt = balance_EOP + parseFloat(((post_study_rate / 12) * balance_EOP).toFixed(2));
        }

        if(i == 0){
            row.disbursed = parseFloat(((orig_fee * amount_borrowed) + amount_borrowed ).toFixed(2));
            row.intBilled = 0;
            row.negAm = 0;
            row.actualPayment = 0;
            row.CFforAPR = (amount_borrowed * -1);
            row.balanceEOP = row.disbursed;
            row.intDue = 0;
        } else {
            if (i >= month_full_repay_start){
                row.intDue = parseFloat(((post_study_rate / 12) * balance_EOP).toFixed(2));
                row.intBilled = row.intDue;

                if(row.prepaid > 0){
                    row.negAm = parseFloat(row.prepaid.toFixed(2));
                    row.actualPayment = row.prepaid + row.intDue
                } else if(balance_EOP == 0){
                    row.negAm = 0;
                    row.actualPayment = 0;
                } else {
                    row.negAm = parseFloat((post_study_pmnt - row.intDue).toFixed(2));
                    row.actualPayment = post_study_pmnt
                }
            } else if(i > 0){
                row.intDue = parseFloat(((in_study_rate / 12) * balance_EOP).toFixed(2));
                row.intBilled = in_study_pmnt;
                row.negAm = parseFloat((in_study_pmnt - row.intDue).toFixed(2));
                row.actualPayment = in_study_pmnt;
            }

            row.balanceEOP = parseFloat((balance_EOP - row.negAm).toFixed(2));
            row.CFforAPR = row.actualPayment;
        }

        paid_int = paid_int + row.intBilled;
        paid_all = paid_all + row.actualPayment;


        balance_EOP = row.balanceEOP;
        rows.push(row);

    }
    var pmt_in_study = arg.in_study_payments == 0 ? 0 : rows[1].actualPayment;
    var pmt_post_study = rows[month_full_repay_start].actualPayment;
    var Apr = apr || calculateAPR(); // use APR from input, or calculate based on credit

    function calculateAPR(){

        var nRate = 0.1,         // initial guess
            nRateStep = 1,       // arbitrary guess
            nResidual = 10,
            nLastResidual = 1,
            nLastRate = nRate;

        for(var i = 0; i < 100; i++){

            if(Math.abs( (nLastResidual - nResidual) / nLastResidual) > 0.00000001){

                nLastResidual = nResidual;
                nResidual = 0;

                for(var j = 0; j < rows.length; j++){
                    nResidual = nResidual + rows[j].CFforAPR / ( Math.pow( (1 + nRate), (((365 / 12) * j) / 365)) );
                }

                nLastRate = nRate;

                if(nResidual >= 0){
                    nRate = nRate + nRateStep;
                } else {
                    nRateStep = nRateStep / 2;
                    nRate = nRate - nRateStep;
                }
            }

        }

        return parseFloat(nLastRate.toFixed(4));

    }

    // Settings object that controls default parameters for library methods:
    accounting.settings = {
	      currency: {
		        symbol : "€",   // default currency symbol is '$'
		        format: "%v %s", // controls output: %s = symbol, %v = value/number (can be object: see below)
		        decimal : ",",  // decimal point separator
		        thousand: ".",  // thousands separator
		        precision : 2   // decimal places
	      },
	      number: {
		        precision : 0,  // default precision on numbers is 0
		        thousand: ".",
		        decimal : ","
	      }
    }

    $("#mesecnoStudij").html(accounting.formatMoney(pmt_in_study));
    $("#mesecnoStudijObresti").html(parseFloat(in_study_rate.toFixed(3))+" %");
    $("#mesecnoPoStudiju").html(accounting.formatMoney(parseFloat(pmt_post_study.toFixed(2))));
    $("#mesecnoPoStudijuObresti").html(parseFloat(post_study_rate.toFixed(3))+" %");
    $("#skupnoVracilo").html(accounting.formatMoney(parseFloat(paid_all.toFixed(2))));
    $("#obrestnaMera").html((parseFloat(Apr.toFixed(4))*100).toFixed(2)+" %");


    return {
        rateInStudy: parseFloat(in_study_rate.toFixed(3)),
        ratePostStudy: parseFloat(post_study_rate.toFixed(3)),
        setUpFee: parseFloat(orig_fee.toFixed(3)),
        paymentInStudy: pmt_in_study,
        paymentPostStudy: parseFloat(pmt_post_study.toFixed(2)),
        totalInterestPaid: parseFloat(paid_int.toFixed(2)),
        totalPaid: parseFloat(paid_all.toFixed(2)),
        apr: (parseFloat(Apr.toFixed(4))*100).toFixed(2)
    };
}

function leta(leto) {
  if(leto==1) {
    return leto+' leto'
  }
  else if(leto==2) {
    return leto+' leti'
  }
  else if(leto==3 || leto==4) {
    return leto+' leta'
  }
  else {
    return leto+' let'
  }
}
