var leta = 1,
    znesek = 500,
    obresti = 0.1,
    status = 'povprecno',
    studij = 'dodiplomski';

var MONTHS_TO_GRAD = arg.monthToGrad || 9,
    MONTHS_GRACE = 3,
    BASE_RATE = 0.099,
    RATE_DIFF_IN_STUDY = 0.02,
    IN_STUDY_PMNT_PERCENT = 0.75,
    IN_STUDY_PMNT_ROUND = 5,
    IN_STUDY_PMNT_MAX = 75,

    loan_length_months = MONTHS_TO_GRAD + MONTHS_GRACE + loan_term * 12,
    month_full_repay_start = MONTHS_TO_GRAD + MONTHS_GRACE + 1,
    post_study_rate = BASE_RATE;

$(document).ready(function() {
    $("#kreditVrednost").html("500 €");
    $("#dobaOdplacilaVrednost").html("1 leto");
    $("#visinaKredita").slider({
        value: 500,
        min: 500,
        max: 40000,
        step: 500,
        slide: function(event, ui) {
            $("#kreditVrednost").html(ui.value + " €");
        }
    });

    $("#dobaOdplacila").slider({
        value:1,
        min:1,
        max:10,
        step:1,
        slide: function(evemt, ui) {
            $("#dobaOdplacilaVrednost").html(leta(ui.value));
        } 
    });

    $(".studij").checkboxradio({
        icon: false
    });

    $(".sposobnost").checkboxradio({
        icon: false
    });

});


function calc(znesek=znesek, leta=leta, status=status, studij=studij) {
    if (studij=='podiplomski') {
        obresti -= 0.02;
    }

    if (status=='dobro') {
        obresti -= 0.02;
    }
    else if (status=='slabo') {
        obresti += 0.02;
    }

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