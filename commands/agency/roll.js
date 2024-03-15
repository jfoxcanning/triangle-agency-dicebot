const { rando } = require("@nastyox/rando.js");
const { SlashCommandBuilder } = require("discord.js");

module.exports = {
    data: new SlashCommandBuilder()
        .setName('roll')
        .setDescription('Alter reality by rolling 6d4.')
        .addStringOption(option => 
            option.setName(`reason`)
                .setDescription(`What are you rolling for?`)
                .setMaxLength(32)
                .setRequired(false)
        )
        .addIntegerOption(option => 
            option.setName(`burnout`)
                .setDescription(`How much Burnout are you suffering from?`)
                .setMinValue(0)    
        )
        ,
    async execute(interaction) {
        //pull options and define variables
        var reasoning = interaction.options.getString(`reason`);
        var burnout = interaction.options.getInteger(`burnout`) ?? 0;
        var hadBurnout = (burnout > 0);

        var reasonOutput = ``;
        var resultsOutput = ``;
        var commentaryOutput = ``;

        // ---------- REASONING
        if (reasoning) {
            var reasonTag = `\`\`\``;
            reasonOutput = `${reasonTag}${reasoning}${reasonTag}`;
        }

        // ---------- RESULTS
        // roll those <dice / bones>
        var results = new Array();
        for (dice = 0; dice < 6; dice++) {
           results.push(rando(1,4));
        }

        // TEST DATA
        //results = new Array(3,3,3,1,1,1);
        
        //sort initial results
        var threes = new Array();
        var chaos = new Array();
        results.forEach((v,i,a) => {
            if (v == 3) {
                threes.push(v);
            } else {
                chaos.push(v);
            }
        });

        var isStable = (threes.length > 0 && threes.length % 3 == 0);
        var isTriscendent = (threes.length == 3);

        if (!isTriscendent) { //if triscendent, do not adjust rolls
            //otherwise start applying adjustments
            var extraChaos = 0;
            for (b = burnout; b > 0; b--) {
                if(threes.length > 0) {
                    chaos.push(`~~${threes.pop()}~~`);
                } else {
                    extraChaos++;
                }
            }
        }

        // ----------- RESULTS ASSEMBLY
        var compiledResults = ``;
        var threesTag = `**`;
        var chaosTag = isStable ? `~~` : ``;

        // add tagged threes to the results
        if (threes.length > 0) { // if there are any threes...
            compiledResults = compiledResults.concat(`${threesTag}${threes.join(`, `)}${threesTag}`);
        }
        if (threes.length > 0 && chaos.length > 0) { // comma check
            compiledResults = compiledResults.concat(`, `);
        }
        if (chaos.length > 0) { // if there's chaos...
            // ...add it to the results string
            compiledResults = compiledResults.concat(`${chaosTag}${chaos.join(`, `)}${chaosTag}`);
        }

        //finalize results
        resultsOutput = `Results: ${compiledResults}`;

        // ----------- COMMENTARY
        var commentaryTag = isStable ? `🔺` : ``;
        var plural = ``;

        var threesText = ``;
        var chaosText = ``;

        // assemble success commentary
        if (threes.length == 0) {
            threesText = `Failure.`;
            commentaryTag = `🔵`;
        } else {
            if (threes.length > 1)
                plural = `es`;

            threesText = `${threes.length} Success${plural}!`;
        }

        // assemble failures commentary
        var totalChaos = chaos.length + extraChaos;
        var chaosNumberText = `${totalChaos}`;
        if (totalChaos == 0 || isStable) {
            chaosNumberText = `0`;
        }

        chaosText = `${chaosNumberText} Chaos generated.`;

        // burnout check
        var burnoutText = ``;
        if (hadBurnout) {
            var burnoutVerb = `applied`;
            //stability check
            if (isStable) {
                burnoutVerb = `cancelled`;
            }

            burnoutText = ` Burnout ${burnoutVerb}.`;
        }

        commentaryOutput = commentaryOutput.concat(`${commentaryTag} ${threesText} ${chaosText}${burnoutText} ${commentaryTag}`);

        //send reply
        await interaction.reply(`${reasonOutput}${resultsOutput}\n${commentaryOutput.trim()}`);
        //triscendence followup
        if (isTriscendent) {
            await interaction.followUp({ content: `🔺🔺🔺**TRISCENDENCE!!!**🔺🔺🔺`, ephemeral: false});
        }
    }
};