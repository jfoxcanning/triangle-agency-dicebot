const { rando } = require("@nastyox/rando.js");
const { SlashCommandBuilder } = require("discord.js");

module.exports = {
    data: new SlashCommandBuilder()
        .setName('conflict')
        .setDescription('Engage in Conflict Resolution.')
        .addStringOption(option => 
            option.setName(`reason`)
                .setDescription(`State your goal.`)
                .setMaxLength(32)
                .setRequired(true)
        )
        ,
    async execute(interaction) {
        //pull options and define variables
        var reasoning = interaction.options.getString(`reason`);

        var reasonOutput = ``;
        var resultsOutput = ``;
        var commentaryOutput = ``;

        // ---------- REASONING
        if (reasoning) {
            var reasonTag = `\`\`\``;
            reasonOutput = `${reasonTag}${reasoning}${reasonTag}`;
        }

        // ---------- RESULTS
        var results;
        var threesTotal = 0;
        var rollsNeeded = 0;

        var compiledResults = ``;
        var threesTag = `**`;
        var chaosTag = ``;
        
        while (threesTotal < 6) {
            // roll those <dice / bones>
            results = new Array();
            for (dice = 0; dice < 6; dice++) {
            results.push(rando(1,4));
            }

            // TEST DATA
            //results = new Array(3,3,3,1,1,1);

            //increment loop count
            rollsNeeded++;
            
            //sort initial results
            var threes = new Array();
            var chaos = new Array();
            results.forEach((v,i,a) => {
                if (v == 3) {
                    threes.push(v);
                    threesTotal++;
                } else {
                    chaos.push(v);
                }
            });

            // ----------- RESULTS ASSEMBLY

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

            // line break
            compiledResults = compiledResults.concat(`\n`);
        }

        //finalize results
        resultsOutput = `Results:\n${compiledResults}`;

        // ----------- COMMENTARY
        var commentaryOutput = ``;

        //assemble commentary
        commentaryOutput = `You achieved **${threesTotal} Successes** in **${rollsNeeded} rolls**.`;
        commentaryOutput = commentaryOutput.concat(`\n-# Your goal becomes reality if you got six 3s faster than everyone else, or if you got more threes than everyone else in the same number of rolls.`);

        //send reply
        await interaction.reply(`${reasonOutput}${resultsOutput}\n${commentaryOutput.trim()}`);
    }
};