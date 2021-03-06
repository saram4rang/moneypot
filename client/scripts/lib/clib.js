define(['lib/seedrandom'], function(Seedrandom) {

    var rng;
    var currentTime;

    return {
        formatSatoshis: function(n, decimals) {
            if (typeof decimals === 'undefined') {
                if (n % 100 === 0)
                    decimals = 0;
                else
                    decimals = 2;
            }

            return (n/100).toFixed(decimals).toString().replace(/(\d)(?=(\d{3})+(?!\d))/g, "$1,");
        },
        
        parseBits: function(text) {
            if(typeof text !== 'string')
                return null;

            var textNum = text.replace(',', '');
            var bits = parseFloat(textNum);
            if (Number.isNaN(bits) || bits < 0)
                return null;
            return bits*100;
        },

        payout: function(betSize, ms) {
            return betSize * Math.pow(Math.E, (0.00006*ms));
        },

        payoutTime: function(betSize, payout) {
            return Math.log(payout/betSize)/0.00006;
        },

        seed: function(newSeed) {
            rng = Seedrandom(newSeed);
            currentTime = 0;
        },

        payoutNoise: function(betSize, ms, type) {
            var c1 = 0.00006;
            var c2 = 1;
            var c3 = 1;
            switch(type) {
                case 1:
                    return betSize * Math.pow(Math.E, (c1*ms)) + (Math.sin(ms * c2) * c3);
                case 2:
                    return betSize * Math.pow(Math.E, (c1*ms)) + (Math.sin(Math.random() * c2) * c3);
                case 3:
                    var rand = rng();
                    var payout = betSize * Math.pow(Math.E, (c1*ms) + (rand * c2) * c3);
                    return betSize * Math.pow(Math.E, (c1*ms)) + ((rand * c2) * c3);
            }
        },

        isNumber: function(n) {
          return !isNaN(parseFloat(n)) && isFinite(n);
        },

        winProb: function(amount, cashOut) {

            // The cashout factor that we need to get the cashOut with our wager.
            var factor = Math.ceil(100 * cashOut / amount);

            /* The probability that the second phase of the RNG chooses a lower
               crashpoint. This is derived in the following way:

               Let r be a random variable uniformly distributed on [0,1) and let
               p be 1/(1-r). Then we need to calculate the probability of
                     floor(100 * (p - (p - 1)*0.01)) < factor

               Using the fact that factor is integral and solving for r yields
                     r < 1 - 99 / (f-1)

               Because r is uniformly distributed the probability is identical
               to the right hand side.

               Combining with the first phase of the RNG we get the probability
               of losing
                     0.01 + 0.99 * (1 - 99 / (factor-1))
               and the win probability
                  1 - 0.01 - 0.99 * (1 - 99 / (factor-1)).
                = 0.99 - 0.99 * (1 - 99 / (factor-1))
                = 0.99 * (1 - (1 - 99 / (factor-1))
                = 0.99 * (99 / (factor-1))
                = 0.99 * (99 / (factor-1))
                = 9801 / (100*(factor-1))
             */
            return 9801 / (100*(factor-1));
        },

        profit: function(amount, cashOut) {

             // The factor that we need to get the cash out with our wager.
             var factor = Math.ceil(100 * cashOut / amount);

             // We calculate the profit with the factor instead of using the
             // difference between cash out and wager amount.
             return amount * (factor-100) / 100;
        },

        houseExpectedReturn: function(amount, cashOut) {

             var p1,p2,p3;
             var v1,v2,v3;

             // Instant crash.
             p1 = 0.01;
             v1 = amount;

             // Player win.
             p2 = this.winProb(amount,cashOut);
             v2 = - 0.01 * amount - this.profit(amount,cashOut);

             // Player loss.
             p3 = 1 - p1 - p2;
             v3 = 0.99 * amount;

             // Expected value.
             return p1 * v1 + p2 * v2 + p3 * v3;
        }

    }

});
