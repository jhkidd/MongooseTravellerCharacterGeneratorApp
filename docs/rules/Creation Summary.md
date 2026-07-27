A Traveller's abilities and skills are determined by their training and past experience. 
Traveller creation begins with rolling characteristics, six values that describe your initial physical and mental capabilities. 
After determining characteristics and a few background skills from adolescent life, it is time to embark on a career. 
Each Traveller goes through one or more four-year career terms, which grant various skills and benefits. 
There are risks associated with each career - serving a tour of duty in the Imperial Marines may give a Traveller a good grounding in combat and weapons use, but there is always the risk of injury in battle. 
A term spent in a corporation is unlikely to get the Traveller injured or killed, but will not usually provide skills valuable in combat.
In addition to skills, Travellers pick up benefits such as cash, equipment, or contacts from a career. 
However, there are limits on how many career terms a Traveller can go through the risks of aging or injury mount up over time, and some Travellers will move between two or three careers in their lives. 
At some point, you will decide to leave your career for a new life of adventure before your Traveller gets too old.
While going through a career, you can establish ties between your Traveller and those of the other players, so everyone will be old friends (or rivals!) before play begins. 
You will also be able to pick a campaign package after everyone has finished creating their Travellers, which will allow you to fill any gaps in the group's skill range.

```yaml
career_creation:
  start: race

  nodes:
  	race:
  		action: "Pick a race for your Traveller."
  		next: characteristics

  	characteristics:
  		action: "Roll 6 pairs of dice and assign the scores to your 6 characteristics. Apply any race specific effects. Calculate your dice modifiers."
  		next: background_skills

  	background_skills:
  		action: "Think about your Travellers upbringing before they turned 18. Choose EDU DM + 3 background skills they start with."
  		next: precareer_education_decision

  	precareer_education_decision:
  		decision: "Decide if you want and are able to apply for pre-career education?"
  		condition: "You may only apply for pre-career education if it is your first, second or third term."
  		edges:
  			- condition: yes
  				to: pick_precareer_education
  			- condition: no
  				to: choose_career

  	pick_precareer_education:
  		action: "Pick whether you would like to apply to university, or to one of the army, navy or marines Military academies."
  		next: resolve_precareer_education

  	resolve_precareer_education:
  		action: "Gain skills and other benefits based on the pre-career education you picked. Roll an event on the pre-career events table."
  		decision: "Roll to see if you successfully graduate."
  		edges:
  			- condition: success
  				to: graduation_benefits
  			- condition: fail
  				to: start_new_term

  	graduation_benefits:
  		action: "Gain additional skills and benefits from graduating university. If you graduated with honors you gain even more."
  		next: start_new_term

  	choose_career:
  		action: "Pick a career and assignment to attempt to enter. Roll to see if you meet the qualification requrirements."
  		edges:
  			- condition: success
  				to: gain_skills
  			- condition: fail
  				to: draft_or_drifter

  	draft_or_drifter:
  		action: "As you failed to qualify for your chosen career, you must either become a drifter, or submit to the draft and roll for a military career."
  		next: gain_skills

  	gain_skills:
  		action: "Gain skills for this term of your career. If it's your first term, gain all skills listed in basic training. Otherwise, pick a skill table and roll a D6 to see which skill or attribute you increase."
  		next: roll_for_survival

  	roll_for_survival:
  		action: "Make a survival roll to see if something terrible happens to you during this term."
  		edges:
  			- condition: success
  				to: roll_for_event
  			- condition: fail
  				to: determine_mishap

  	determine_mishap:
  		action: "Roll on your careers mishap table to find out exactly what happens to you. You will leave the career unless the mishap explicitly states you can continue."
  		edges:
  			- condition: "result says do not leave career"
  				to: roll_for_event
  			- condition: "leave career"
  				to: roll_for_benefits_and_muster_out

  	roll_for_event:
  		action: "Roll on the careers event table and resolve it's effects."
  		next: commission_or_advancement

  	commission_or_advancement:
  		action: "Roll for either commission or advancement. Commission is only available for specific military careers. You may only attempt a commission roll in your first term, unless your SOC is 9 or higher, in which case you may attempt in any term."
  		next: continue_this_career

  	continue_this_career:
  		decision: "It is the end of this term. Would you like to stay in your current career?"
  		edges:
  			- condition: yes
  				to: start_new_term
  			- condition: no
  				to: roll_for_benefits_and_muster_out

  	start_new_term:
  		action: "Increase your age by +4 years. If aged 34 or older roll for aging effects. If you are continuing a previous career, go to gain_skills, otheriwse if you do not currently have a career, go to choose_career."
  		edges:
  			- condition: "continuing career"
  				to: gain_skills
  			- condition: "no current career"
  				to: choose_career

  	roll_for_benefits_and_muster_out:
  		action: "Roll on the benefits tables for each benefit earned in this career. You gain 1 benefit roll for each FULL term served, plus an extra benefit roll if you reached rank 1 or 2, or an extra two benefits rolls if you reached rank 3 or 4, or an extra three benefit rolls if you reached rank 5 or above plus a DM+1 on rolls."
  		next: continue_decision

  	continue_decision:
  		decision: "Do you wish to finalise your character and finish character creation?"
  		edges:
  			- condition: yes
  				to: resolve_pension_and_medical_debt
  			- condition: no
  				to: start_new_term

  	resolve_pension_and_medical_debt:
  		action: "Resolve pension and medical debt"
  		next: character_sheet

  	character_sheet:
  		type: end
  		action: "See the character sheet for your Traveller, with all their stats, benefits and backstory."
```