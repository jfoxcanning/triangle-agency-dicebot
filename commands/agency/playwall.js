const { SlashCommandBuilder, ModalBuilder, TextInputBuilder, TextInputStyle, ActionRowBuilder, ActionRow } = require("discord.js");
const {rando} = require(`@nastyox/rando.js`);

module.exports = {
    data: new SlashCommandBuilder()
        .setName('playwall')
        .setDescription(`Make a nonstandard playwalled dice roll.`)
        .addStringOption(option => 
            option.setName(`code`)
                .setDescription(`The playwalled document whose ability you are using.`)
                .setRequired(true)
                .setMaxLength(3)
        )
        ,
    async execute(interaction) {
        //read and store input
        var pd = interaction.options.getString(`code`).toUpperCase();

        switch(pd) {
            case `U1`: // the Six-Sided Die
                var d6Modal = new ModalBuilder()
                    .setCustomId(`d6Modal`)
                    .setTitle(`The Six-Sided Die`);
                
                var reasoningInput = new TextInputBuilder()
                    .setCustomId(`reasoningInput`)
                    .setLabel(`What Anomaly ability are you using?`)
                    .setRequired(false)
                    .setStyle(TextInputStyle.Short)
                    .setMaxLength(45);
                
                var burnoutInput = new TextInputBuilder()
                    .setCustomId(`burnoutInput`)
                    .setLabel(`Amount of Burnout to apply:`)
                    .setRequired(false)
                    .setMaxLength(3)
                    .setValue(`0`)
                    .setStyle(TextInputStyle.Short);

                d6Modal.addComponents(new ActionRowBuilder().addComponents(reasoningInput), new ActionRowBuilder().addComponents(burnoutInput));

                interaction.showModal(d6Modal);
                interaction.awaitModalSubmit({time: 60_000})
                    .then(modalResponse => {
                        //pull options and define variables
                        var reasoning = modalResponse.fields.getTextInputValue(`reasoningInput`);
                        var initialBurnout = parseInt(modalResponse.fields.getTextInputValue(`burnoutInput`)) ?? 0;
                        if (initialBurnout < 0) initialBurnout = 0;
                        var hadBurnout = (initialBurnout > 0);

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
                        var d6roll = rando(1,6);

                        // TEST DATA
                        //results = new Array(1,2,3,1,2,3);
                        //d6roll = 3;
                        
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
                        var threesTotal = threes.length;
                        var chaosTotal = chaos.length;

                        // handle the d6
                        switch(d6roll) {
                            case 3:
                                threesTotal += 1;
                                break;
                            case 6:
                                threesTotal += 2;
                                break;
                            default:
                                chaosTotal += 1;
                                break;
                        }

                        var isTriscendent = (threesTotal == 3);
                        
                        if (!isTriscendent) { //if triscendent, do not adjust rolls
                            //otherwise start applying burnout adjustments
                            for (b = initialBurnout; b > 0; b--) {
                                if(threes.length > 0) {
                                    chaos.push(`~~${threes.pop()}~~`);
                                }
                                if (threesTotal > 0)
                                    threesTotal--;
                                chaosTotal++;
                            }
                        }

                        //stability check
                        var isStable = (threesTotal > 0 && threesTotal % 3 == 0);
                
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
                        // add the d6
                        compiledResults = compiledResults.concat(`, [**${d6roll}**]`);
                
                        //finalize results
                        resultsOutput = `Results: ${compiledResults}`;
                
                        // ----------- COMMENTARY
                        var commentaryTag = isStable ? `🔺` : ``;
                        var plural = ``;
                
                        var threesText = ``;
                        var chaosText = ``;
                
                        // assemble success commentary
                        if (threesTotal == 0) {
                            threesText = `Failure.`;
                            commentaryTag = `🔵`;
                        } else {
                            if (threesTotal > 1)
                                plural = `es`;
                
                            threesText = `${threesTotal} Success${plural}!`;
                        }
                
                        // assemble failures commentary
                        var chaosNumberText = `${chaosTotal}`;
                        if (chaosTotal == 0 || isStable) {
                            chaosNumberText = `Zero`;
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
                        modalResponse.reply(`${reasonOutput}${resultsOutput}\n${commentaryOutput.trim()}`);
                        //triscendence or unleash followup
                        if (isTriscendent) {
                            modalResponse.fetchReply()
                            .then(modalReply => {
                                modalReply.reply(`🔺🔺🔺**TRISCENDENCE!!!**🔺🔺🔺`);
                            });
                        }
                        else if (threesTotal == 7) {
                            modalResponse.fetchReply()
                            .then(modalReply => {
                                modalReply.reply({content: `🧿 **ANOMALY UNL3ASHED!** 🧿`, ephemeral: false});
                            });
                        }
                    });

                break;
            case `G3`: // the Sponsorship Die (d8)
                var d8Modal = new ModalBuilder()
                    .setCustomId(`d8Modal`)
                    .setTitle(`The Sponsorship Die: the d8`);

                var reasoningInput = new TextInputBuilder()
                    .setCustomId(`reasoningInput`)
                    .setLabel(`What are you Asking the Agency to adjust?`)
                    .setRequired(false)
                    .setStyle(TextInputStyle.Short)
                    .setMaxLength(45);
                
                var burnoutInput = new TextInputBuilder()
                    .setCustomId(`burnoutInput`)
                    .setLabel(`Amount of Burnout to apply:`)
                    .setRequired(false)
                    .setMaxLength(3)
                    .setValue(`0`)
                    .setStyle(TextInputStyle.Short);
                
                d8Modal.addComponents(new ActionRowBuilder().addComponents(reasoningInput), new ActionRowBuilder().addComponents(burnoutInput));
                interaction.showModal(d8Modal);
                interaction.awaitModalSubmit({ time: 60_000 })
                    .then(modalResponse => {
                        //get field inputs
                        var reasoning = modalResponse.fields.getTextInputValue(`reasoningInput`);
                        var initialBurnout = parseInt(modalResponse.fields.getTextInputValue(`burnoutInput`));
                        var initialBurnout = parseInt(modalResponse.fields.getTextInputValue(`burnoutInput`)) ?? 0;
                        if (initialBurnout < 0) initialBurnout = 0;
                        var hadBurnout = (initialBurnout > 0);

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
                        var d8roll = rando(1,8);

                        // TEST DATA
                        //results = new Array(3,3,3,1,1,1);
                        //d8roll = 3;
                        
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
                        var threesTotal = threes.length;
                        var chaosTotal = chaos.length;

                        // check for successes on the d8
                        var d8Threes = 0;
                        switch(d8roll) {
                            case 3:
                                d8Threes = 1;
                                break;
                            case 6:
                                d8Threes = 2;
                                break;
                        }

                        var minusTotal = threesTotal - d8Threes;
                        var plusTotal = threesTotal + d8Threes;

                        var isTriscendent = (minusTotal == 3) || (threesTotal == 3) || (plusTotal == 3);
                        
                        if (!isTriscendent) { //if triscendent, do not adjust rolls
                            //otherwise start applying burnout adjustments
                            for (b = initialBurnout; b > 0; b--) {
                                if(threes.length > 0) {
                                    chaos.push(`~~${threes.pop()}~~`);
                                }
                                if (threesTotal > 0)
                                    threesTotal--;
                                chaosTotal++;
                            }

                            if (minusTotal != 3) // update minus
                                minusTotal = threesTotal - d8Threes;
                            
                            if (!plusTotal != 3) // update plus
                                plusTotal = threesTotal + d8Threes;
                        }

                        //stability check
                        var isStable = (minusTotal > 0 && minusTotal % 3 == 0) || (threesTotal > 0 && threesTotal % 3 == 0) || (plusTotal > 0 && plusTotal % 3 == 0);
                
                        // ----------- RESULTS ASSEMBLY
                        var compiledResults = ``;
                        var threesTag = `**`;
                        var chaosTag = ``;
                
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
                        // add the d8
                        compiledResults = compiledResults.concat(`, /__**${d8roll}**__\\`);
                
                        //finalize results
                        resultsOutput = `Results: ${compiledResults}`;
                
                        // ----------- COMMENTARY
                        var commentaryTag = ``;
                        var plural = ``;
                
                        var threesText = ``;
                        var chaosText = ``;
                
                        // assemble success commentary
                        var timesBurnoutApplied = 0;
                        var maxBurnout = (d8Threes == 0) ? 1 : 3;
                        var stableTag = ``;
                        var possibleText = ``;

                        if (threesTotal == 0 && d8Threes == 0) {
                            threesText = `Failure.`;
                            commentaryTag = `🔵`;
                        } else {
                            if (d8Threes == 0) {
                                if (threesTotal > 1) plural = `es`;
                                if (threesTotal > 0 && threesTotal % 3 == 0) commentaryTag = `🔺`;

                                threesText = `${threesTotal} Success${plural}!`;
                            } else {
                                possibleText = `POSSIBLE `;
                                if (minusTotal > 1 || threesTotal > 1 || plusTotal > 1) plural = `es`;

                                // minus check
                                if (hadBurnout && !(minusTotal > 0 && minusTotal % 3 == 0)) {
                                    minusTotal -= initialBurnout;
                                    timesBurnoutApplied++;
                                }

                                if (minusTotal > 0) {
                                    stableTag = (minusTotal % 3 == 0) ? `🔺` : ``;
                                } else {
                                    stableTag = `🔵 `;
                                }
                                threesText = threesText.concat(`${stableTag}${minusTotal}, `);

                                // regular check
                                if (hadBurnout && !(threesTotal > 0 && threesTotal % 3 == 0)) {
                                    threesTotal -= initialBurnout;
                                    timesBurnoutApplied++;
                                }

                                if (threesTotal > 0) {
                                    stableTag = (threesTotal % 3 == 0) ? `🔺` : ``;
                                } else {
                                    stableTag = `🔵 `;
                                }
                                threesText = threesText.concat(`${stableTag}${threesTotal}, or `);

                                // plus check
                                if (hadBurnout && !(plusTotal > 0 && plusTotal % 3 == 0)) {
                                    plusTotal -= initialBurnout;
                                    timesBurnoutApplied++;
                                }

                                if (plusTotal > 0) {
                                    stableTag = (plusTotal % 3 == 0) ? `🔺` : ``;
                                } else {
                                    stableTag = `🔵 `;
                                }
                                threesText = threesText.concat(`${stableTag}${plusTotal}`);

                                // append Success text
                                threesText = threesText.concat(` Success${plural}!`);
                            }
                        }
                
                        // assemble failures commentary
                        var chaosNumberText = `${chaosTotal}`;
                        if (isStable && chaosTotal != 0) {
                            chaosNumberText = chaosNumberText.concat(` (or 0)`);
                        }
                        if (d8Threes == 0 && isStable)
                            chaosNumberText = `0`;
                
                        chaosText = `${chaosNumberText} Chaos generated.`;
                
                        // burnout check
                        var burnoutText = ``;
                        if (hadBurnout) {
                            var maybeText = (d8Threes > 0 && timesBurnoutApplied != maxBurnout) ? `can be ` : ``;
                            var burnoutVerb = `applied`;
                            //stability check
                            if (isStable) {
                                burnoutVerb = `cancelled`;
                            }
                
                            burnoutText = ` Burnout ${maybeText}${burnoutVerb}.`;
                        }
                
                        commentaryOutput = commentaryOutput.concat(`${commentaryTag} ${threesText} ${chaosText}${burnoutText} ${commentaryTag}`);

                        // Sponsorship check
                        var sponsorText = ``;
                        if (minusTotal > 0 || threesTotal > 0 || plusTotal > 0) {
                            switch(d8roll) {
                                case 1:
                                    sponsorText = `\n> *You must reference **something that happened exactly 40 hours ago** to your target or location that affects this Causality Chain, or this roll fails.*`;
                                    break;
                                case 2:
                                    sponsorText = `\n> *You must reference **something that happened in another country** that affects this Causality Chain, or this roll fails.*`;
                                    break;
                                case 4:
                                    sponsorText = `\n> *You must reference how **exposure to a piece of fiction** affects this Causality Chain, or this roll fails.*`;
                                    break;
                                case 5:
                                    sponsorText = `\n> *You must reference how **Wet Mouth Brand Chewing Gum & Dietary Supplement** affects this Causality Chain, or this roll fails.*`;
                                    break;
                                case 7:
                                    sponsorText = `\n> *You must include **something blue** in this Causality Chain, or this roll fails.*`;
                                    break;
                                case 8:
                                    sponsorText = `\n> *You must reference **a betrayal** that affects this Causality Chain, or this roll fails.*`;
                                    break;
                            }
                        }

                        //send reply
                        modalResponse.reply(`${reasonOutput}${resultsOutput}\n${commentaryOutput.trim()}${sponsorText}`);
                        
                        //triscendence followup?
                        if (isTriscendent) {
                            modalResponse.fetchReply()
                            .then(modalReply => {
                                modalReply.reply(`🔺🔺🔺**${possibleText}TRISCENDENCE!!!**🔺🔺🔺`);
                            });
                        }
                    })
                break;
            case `N2`: // the Ten-Sided Die
                var d10Modal = new ModalBuilder()
                    .setCustomId(`d10Modal`)
                    .setTitle(`The Ten-Sided Die`);
                
                var burnoutInput = new TextInputBuilder()
                    .setCustomId(`burnoutInput`)
                    .setLabel(`Amount of Burnout to apply:`)
                    .setStyle(TextInputStyle.Short)
                    .setMaxLength(3)
                    .setPlaceholder(`0`)
                    .setRequired(false);
                
                var d6Input = new TextInputBuilder()
                    .setCustomId(`d6Input`)
                    .setLabel(`Include the d6? (y/n)`)
                    .setMaxLength(1)
                    .setStyle(TextInputStyle.Short)
                    .setValue(`n`)
                    .setRequired(true);

                d10Modal.addComponents(new ActionRowBuilder().addComponents(burnoutInput), new ActionRowBuilder().addComponents(d6Input));

                interaction.showModal(d10Modal);
                interaction.awaitModalSubmit({ time: 60_000 })
                    .then(modalResponse => {
                        var includeD6 = (modalResponse.fields.getTextInputValue(`d6Input`).toLowerCase() === `y`);
                        var initialBurnout = parseInt(modalResponse.fields.getTextInputValue(`burnoutInput`));
                        if (initialBurnout < 0)
                            initialBurnout = 0;

                        // --------- d10 RESULTS
                        var d10roll = rando(1,10);
                        var d6roll = rando(1,6);

                        // TEST DATA
                        //d10roll = 3;
                        //d6roll = 3;

                        var resultsOutput = `Results: < **${d10roll}** )`;

                        if (includeD6)
                            resultsOutput = resultsOutput.concat(`, [ **${d6roll}** ]`);

                        var successTotal = d10roll;
                        var failureTotal = d10roll;

                        if (includeD6) {
                            switch(d6roll) {
                                case 3:
                                    successTotal += 1;
                                    break;
                                case 6:
                                    successTotal += 2;
                                    break;
                                default:
                                    failureTotal += 1;
                                    break;
                            }
                        }

                        var isTriscendent = (successTotal == 3);

                        // apply burnout
                        var hadBurnout = initialBurnout > 0;
                        for (b = initialBurnout; b > 0; b--) {
                            if (successTotal > 0)
                                successTotal--;
                            failureTotal++;
                        }

                        if (d10roll == 3) {
                            successTotal = 0;
                        }

                        // ---------- d10 COMMENTARY
                        var commentaryOutput = ``;

                        var burnoutText = hadBurnout ? ` Burnout applied.` : ``;

                        if (d10roll == 3) {
                            commentaryOutput = `🔺 Failure. ${failureTotal} Chaos Generated.${burnoutText} 🔺`;
                        } else {
                            var plural = (successTotal == 1) ? `` : `es`;
                            commentaryOutput = `${successTotal} Success${plural}! ${failureTotal} Chaos generated.${burnoutText}`;
                        }
                
                        // ---------- SEND OUTPUT
                        modalResponse.reply(`${resultsOutput}\n${commentaryOutput}`);
                        // triscendence and unleash check
                        if (isTriscendent) {
                            modalResponse.fetchReply()
                            .then(modalReply => {
                                modalReply.reply(`🔺🔺🔺**TRISCENDENCE!!!**🔺🔺🔺`);
                            });
                        }
                        else if (successTotal == 7) {
                            modalResponse.fetchReply()
                            .then(modalReply => {
                                modalReply.reply(`🧿 **ANOMALY UNL3ASHED!** 🧿`);
                            });
                        }
                    });
                break;
            case `T3`: // Skill Checks; the d20
                // modal time
                var d20Modal = new ModalBuilder()
                    .setCustomId(`d20Modal`)
                    .setTitle(`Skill Check: the d20`);
                
                var qaInput = new TextInputBuilder()
                    .setCustomId(`qaInput`)
                    .setLabel(`How many QAs do you have in this Quality?`)
                    .setStyle(TextInputStyle.Short);
                
                d20Modal.addComponents(new ActionRowBuilder().addComponents(qaInput));

                interaction.showModal(d20Modal);
                interaction.awaitModalSubmit({ time: 60_000 })
                    .then(modalResponse => {
                        var qas = parseInt(modalResponse.fields.getTextInputValue(`qaInput`));
                        
                        // ---------- d20 RESULTS
                        // roll the dice
                        var d20Roll = rando(1,20);

                        // TEST DATA
                        //d20roll = 3;
                        //qas = 1;

                        var d20Total = d20Roll + qas;

                        var resultsOutput = `Results: <${d20Roll}> + ${qas}`;

                        // ---------- d20 COMMENTARY
                        var commentaryOutput = ``;
                        var successText= `Success! Your backstory has been adjusted.`;
                        var failureText = `\nYou lose all QAs in this quality, and one part of your backstory never happened.`;
                        var isTriscendent = false;

                        if (d20Roll == 3) {
                            commentaryOutput = `🔺 Automatic ${successText} 🔺`;
                            isTriscendent = true;
                        }
                        else if (d20Roll == 7) {
                            commentaryOutput = `🔵 Automatic failure. ${d20roll} Chaos generated. 🔵${failureText}`;
                        }
                        else if (d20Total > 10) {
                            commentaryOutput = `${successText}`;
                        }
                        else { // d20Total in failure range
                            commentaryOutput = `Failure. ${d20roll} Chaos generated.${failureText}`;
                        }
                        
                        // ---------- d20 OUTPUT
                        modalResponse.reply(`${resultsOutput}\n${commentaryOutput}`);
                        if (isTriscendent) {
                            modalResponse.fetchReply()
                            .then(modalReply => {
                                modalReply.reply(`🔺🔺🔺 TRISCENDENCE! 🔺🔺🔺`);
                            });
                        }
                    })
                    .catch(err => {});

                break;
            case `X2`: // Background Talent d100
                // roll the die!
                var extras = rando(1,100);

                // TEST DATA
                //extras = 33;

                await interaction.reply({
                    content: `You have **${extras} Extras** available this mission.\n*Keep track of this number yourself!*\n> **If Veenilla (the bot developer) is playing in your game right now,** this roll is not legal. Please say hello, then borrow someone else's dice or dice bot to roll for Extras.`,
                    ephemeral: true
                });

                break;
            default:
                await interaction.reply(`Invalid Playwall. Please verify your request and report any complaints to Vault staff.`);
                break;
        }
    }
};