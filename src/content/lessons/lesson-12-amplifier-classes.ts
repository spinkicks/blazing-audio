import type { Lesson } from '../types';

export const amplifierClassesLesson: Lesson = {
  id: 'amplifier-classes',
  order: 12,
  title: 'Amplifier Classes',
  subtitle: 'How Class A, B, AB, and D output stages trade heat, distortion, and efficiency',
  estimatedMinutes: 34,
  concepts: [
    'Output devices as power valves',
    'Conduction angle and crossover distortion',
    'Class D PWM, MOSFETs, and filters',
  ],
  steps: [
    {
      id: 'ac-why',
      type: 'concept',
      title: 'Amplifier class is about how the output devices work',
      body: 'An amplifier class is not a quality grade. It describes how the output stage makes the speaker-power version of a tiny audio signal.\n\nEvery class is trying to solve the same problem: take energy from the power supply and push it into the speaker in the shape of the music. The class tells you how the output devices are allowed to conduct current while doing that job.',
      visual: { kind: 'ampClassDiagram', config: { variant: 'overview', height: 390 } },
    },
    {
      id: 'ac-output-devices',
      type: 'concept',
      title: 'The output devices are controlled power valves',
      body: 'The music signal entering a power amplifier is small. It is a control signal, not the main source of speaker power. The heavy energy comes from the amplifier power supply.\n\nThe output devices - usually power transistors or MOSFETs in modern amps, sometimes tubes in older or boutique designs - act like controllable valves between the power supply and the speaker. A small input change tells a much larger current how to flow.',
    },
    {
      id: 'ac-valves-not-copies',
      type: 'concept',
      title: 'The speaker does not get a boosted copy by magic',
      body: 'A useful mental model is this: the input waveform is the steering wheel, the power supply is the engine, and the output devices are the throttle. The amplifier is not stretching the little input signal itself; it is using that input to shape power from the supply.\n\nThat is why output stages get hot. Any power that does not become useful speaker output becomes waste heat in the output devices, power supply, filter parts, or heatsink.',
    },
    {
      id: 'ac-conduction-angle',
      type: 'concept',
      title: 'Conduction angle is the key idea',
      body: 'A device conducts when current is flowing through it. Conduction angle means how much of the waveform cycle a device stays on.\n\nClass A keeps one device conducting for the full 360 degrees of the waveform. Class B uses each device for about 180 degrees. Class AB uses more than 180 degrees per device, so the two halves overlap near zero. Class D is different: its devices switch fully on and fully off at high speed instead of following the audio smoothly.',
    },
    {
      id: 'ac-meter-a',
      type: 'problem',
      prompt: 'A bench readout shows huge idle heat, low efficiency, and one device conducting the entire waveform. Which amplifier class is this?',
      interaction: {
        kind: 'ampClassMeter',
        reading: {
          title: 'Always-on output stage',
          efficiency: 22,
          idleHeat: 91,
          conduction: 'one device: full waveform',
          distortionClue: 'no crossover handoff',
          switching: false,
        },
        target: 'A',
      },
      feedback: {
        correct: 'Correct. Full-wave conduction with high idle heat is the signature of Class A.',
        incorrect: [
          { match: 'B', text: 'Class B splits the waveform between two devices. It would not keep one device conducting the entire cycle.' },
          { match: 'AB', text: 'Class AB uses overlap, but it is not fully on for the entire waveform like this readout.' },
          { match: 'D', text: 'Class D would show switching behavior and much higher efficiency.' },
        ],
        defaultIncorrect: 'Look for the always-on clue: one device conducts the entire waveform.',
        insight:
          'Class A is simple to understand because the device never hands off the waveform. The price is constant idle power and heat.',
      },
    },
    {
      id: 'ac-a',
      type: 'concept',
      title: 'Class A: one device conducts the whole wave',
      body: 'In Class A, the output device is biased so it sits in the middle of its working range. When the input waveform rises, current rises. When the input falls, current falls. But the device never turns fully off during the audio cycle.\n\nBecause there is no handoff between positive and negative halves, a Class A stage can be very linear. The waveform is handled by one continuously awake device.',
      visual: { kind: 'ampClassDiagram', config: { variant: 'A', height: 420 } },
    },
    {
      id: 'ac-a-efficiency',
      type: 'concept',
      title: 'Class A heat is the lesson you feel with your hand',
      body: 'Class A wastes power even when no music is playing. The output device is biased hot at idle, so the amplifier may draw a lot from the wall while sitting silent.\n\nPractical Class A audio amplifiers are often around 15-30% efficient, depending on design. That means most of the input power becomes heat rather than speaker output. Big heatsinks, low power ratings, warm chassis, and heavy power supplies are normal.',
    },
    {
      id: 'ac-a-distortion-use',
      type: 'concept',
      title: 'Class A trades efficiency for simple linearity',
      body: 'The main advantage is that Class A avoids crossover distortion because there is no positive-device-to-negative-device handoff. That makes it attractive for low-power stages where purity matters more than efficiency.\n\nCommon places: small-signal preamp stages, headphone amps, boutique low-power speaker amps, guitar amp stages, and measurement or lab circuits. The drawback is obvious: for high speaker power, Class A gets large, hot, and wasteful fast.',
    },
    {
      id: 'ac-b',
      type: 'concept',
      title: 'Class B: split the waveform into two halves',
      body: 'Class B uses a push-pull output stage. One output device handles the positive half of the waveform. A complementary device handles the negative half.\n\nEach device rests when it is not needed, so idle heat is much lower than Class A. Instead of keeping one valve open all the time, Class B asks each valve to work only for its half-cycle.',
      visual: { kind: 'ampClassDiagram', config: { variant: 'B', height: 420 } },
    },
    {
      id: 'ac-b-efficiency',
      type: 'concept',
      title: 'Class B is efficient because idle current is low',
      body: 'An ideal Class B sine-wave amplifier can reach about 78.5% maximum efficiency. Real designs do worse, but the improvement over Class A is still large.\n\nThe heat profile is also different. At idle, little current flows. As output power rises, the devices warm up because they are now delivering current to the speaker. This makes Class B much more practical than Class A for higher power, at least on paper.',
    },
    {
      id: 'ac-b-crossover',
      type: 'concept',
      title: 'The Class B problem lives at zero crossing',
      body: 'The zero crossing is where the waveform changes from positive to negative. In pure Class B, the positive device is turning off while the negative device is turning on.\n\nReal transistors need a little voltage before they conduct cleanly. If neither device fully controls the speaker for a tiny moment, the waveform gets a notch. That notch is crossover distortion. It is especially ugly because it happens every cycle and creates extra harmonics not in the music.',
    },
    {
      id: 'ac-b-use',
      type: 'concept',
      title: 'Pure Class B is more lesson than hi-fi destination',
      body: 'Class B is important because it explains the push-pull idea and the crossover problem. But pure Class B is not the usual choice for high-quality audio power amplifiers because the zero-crossing notch is hard to ignore.\n\nYou may see Class B principles in simple educational circuits, some non-hi-fi power stages, and designs where efficiency matters more than low-level distortion. In audio, the common fix is Class AB.',
    },
    {
      id: 'ac-ab',
      type: 'concept',
      title: 'Class AB: add a small overlap',
      body: 'Class AB starts with the Class B push-pull idea, then adds idle bias so both output devices conduct a little around the zero crossing.\n\nThat overlap is the whole trick. The positive device does not let go exactly when the negative device starts, and the negative device does not wait until the waveform is already past zero. The handoff becomes smoother.',
      visual: { kind: 'ampClassDiagram', config: { variant: 'AB', height: 420 } },
    },
    {
      id: 'ac-ab-bias',
      type: 'concept',
      title: 'Bias is the knob between notch and heat',
      body: 'Bias means a deliberate idle current through the output stage. Too little bias and the amplifier behaves like Class B: cool, efficient, but notchy at the crossover. Too much bias and it slides toward Class A: smooth, but hot and inefficient.\n\nClass AB lives in the middle. It uses just enough idle current to reduce crossover distortion without paying the full Class A heat penalty.',
    },
    {
      id: 'ac-bias-tune',
      type: 'problem',
      prompt: 'Adjust the output-stage bias so the crossover notch disappears without wasting excessive idle heat.',
      interaction: {
        kind: 'ampBias',
        initialBias: 12,
        minBias: 0,
        maxBias: 100,
        step: 1,
        targetMin: 35,
        targetMax: 52,
      },
      feedback: {
        correct: 'Correct. You set enough bias for Class AB overlap without cranking idle current into the hot zone.',
        incorrect: [
          { match: 'bias-low', text: 'The stage is still biased too cold. Watch the zero crossing: the notch means the devices are not overlapping enough.' },
          { match: 'bias-high', text: 'The notch is gone, but now the idle current is hotter than needed. Back it down into the AB window.' },
        ],
        defaultIncorrect: 'Find the overlap window: no visible notch, but not excessive idle heat.',
        insight:
          'Class AB is a bias compromise. The right setting is not maximum current; it is enough overlap to smooth the handoff.',
      },
    },
    {
      id: 'ac-ab-efficiency-use',
      type: 'concept',
      title: 'Class AB became the classic analog power amp',
      body: 'Class AB is less efficient than Class B, but much more practical than Class A. Many real AB amplifiers land somewhere around 35-65% efficiency depending on output level, supply design, speaker load, and how heavily they are biased.\n\nCommon places: traditional stereo receivers, many home-theater receiver channels, older car amplifiers, pro audio amps before Class D became dominant, and guitar power amps. Drawbacks include heatsink size, thermal bias drift, and less efficiency than Class D.',
    },
    {
      id: 'ac-d-intro',
      type: 'concept',
      title: 'Class D is not automatically digital audio',
      body: 'The D in Class D does not mean digital. It is just the next letter after earlier amplifier classes. A Class D amplifier can accept an analog input and still be called Class D.\n\nWhat makes it Class D is the output stage. Instead of output devices acting like partly open valves, the MOSFETs switch fully on and fully off very fast. The audio information is carried in the timing or width of those pulses.',
    },
    {
      id: 'ac-d-flow',
      type: 'concept',
      title: 'Class D signal flow: audio, pulses, switches, filter',
      body: 'A simplified Class D chain is: audio input, PWM modulator, MOSFET switching bridge, LC low-pass filter, speaker.\n\nThe modulator turns the audio into a pulse-width-modulated signal. The MOSFETs make a high-power version of those pulses from the supply rails. The output filter removes the ultrasonic switching carrier, leaving the slower audio waveform for the speaker.',
      visual: { kind: 'ampClassDiagram', config: { variant: 'D', height: 420 } },
    },
    {
      id: 'ac-d-order',
      type: 'problem',
      prompt: 'Put the Class D signal path in order, from the small audio input to the speaker.',
      interaction: {
        kind: 'classDSignalPath',
        items: [
          { id: 'audio', text: 'Audio input waveform' },
          { id: 'pwm', text: 'PWM modulator or comparator creates varying-width pulses' },
          { id: 'bridge', text: 'MOSFET bridge switches the supply rails at high speed' },
          { id: 'filter', text: 'LC low-pass filter removes the switching carrier' },
          { id: 'speaker', text: 'Speaker receives the reconstructed audio waveform' },
        ],
        correctOrder: ['audio', 'pwm', 'bridge', 'filter', 'speaker'],
      },
      feedback: {
        correct: 'Correct. Class D turns audio into pulse timing, switches power efficiently, then filters the pulses back into audio.',
        incorrect: [
          { match: 'audio', text: 'Start with the low-level audio waveform. Everything else is the amplifier transforming and powering it.' },
          { match: 'pwm', text: 'The PWM modulator has to come before the MOSFET bridge, because it tells the switches when to turn on and off.' },
          { match: 'bridge', text: 'The bridge makes the PWM pulses powerful, but it needs the modulator signal first.' },
          { match: 'filter', text: 'Filtering comes after switching. The filter removes the high-frequency carrier from the power pulses.' },
          { match: 'speaker', text: 'The speaker is last. It should not receive the raw high-frequency switching pulses as the intended signal.' },
        ],
        defaultIncorrect: 'Trace the job: create pulse timing, switch power, filter, then drive the speaker.',
        insight:
          'Class D efficiency comes from the switching bridge, but the filter is what makes those pulses useful as audio.',
      },
    },
    {
      id: 'ac-d-pwm',
      type: 'concept',
      title: 'PWM: width carries the audio level',
      body: 'PWM means pulse-width modulation. Imagine comparing the audio wave to a very fast triangle wave. When the audio is high, the comparator output stays on for a wider part of each switching cycle. When the audio is low, the on-time gets narrower.\n\nThe result is a stream of fixed-height pulses whose widths change with the music. The pulses are not the final speaker waveform yet. They are a coded way to tell the output MOSFETs how much average voltage to deliver after filtering.',
    },
    {
      id: 'ac-d-mosfets',
      type: 'concept',
      title: 'MOSFETs are efficient when used as switches',
      body: 'In a linear amplifier, an output transistor may be partly on, dropping voltage while current flows through it. Voltage drop times current equals heat inside the device.\n\nIn Class D, the MOSFETs try to avoid that partly-on region. Fully off means almost no current. Fully on means very low voltage drop. The worst losses happen during switching transitions, gate-drive losses, resistance in the MOSFETs, and real-world imperfections. Good design makes those losses small.',
    },
    {
      id: 'ac-d-filter',
      type: 'concept',
      title: 'The LC filter reconstructs the audio',
      body: 'The speaker should move at audio frequencies, not at the ultrasonic switching frequency. The output filter is usually an inductor and capacitor arranged as a low-pass filter.\n\nLow-pass means slow changes pass and very fast changes are reduced. The changing average of the PWM pulses becomes the audio waveform. The switching carrier is pushed down so the speaker mostly sees the intended music instead of raw rectangular pulses.',
    },
    {
      id: 'ac-d-efficiency',
      type: 'concept',
      title: 'Class D heat is low because it avoids the halfway state',
      body: 'Class D amplifiers often reach 85-95% efficiency in real products. That is why a compact plate amp can drive a subwoofer, a tiny Bluetooth speaker can run from a battery, and a modern pro amp can deliver huge power without weighing like a boat anchor.\n\nLess waste heat means smaller heatsinks, smaller power supplies for the same output, and better battery life. This is the main reason Class D has taken over many high-power and portable audio categories.',
    },
    {
      id: 'ac-d-drawbacks',
      type: 'concept',
      title: 'Class D still has design challenges',
      body: 'Class D is efficient, not magic. The switching frequency can create electromagnetic interference if layout and filtering are poor. The output filter can interact with the speaker load. Dead time between MOSFETs must be controlled so both switches do not short the supply, but too much dead time adds distortion.\n\nGood Class D amps solve these problems well. Bad Class D amps can sound harsh, hiss, radiate noise, or behave differently with different speakers. Implementation quality matters as much as the letter on the spec sheet.',
    },
    {
      id: 'ac-meter-d',
      type: 'problem',
      prompt: 'A compact amp runs cool, measures around 90% efficient, and the scope shows high-frequency switching before the output filter. Which class is it?',
      interaction: {
        kind: 'ampClassMeter',
        reading: {
          title: 'Cool high-power switching stage',
          efficiency: 91,
          idleHeat: 16,
          conduction: 'MOSFETs: fully on/off pulses',
          distortionClue: 'filter and timing dependent',
          switching: true,
        },
        target: 'D',
      },
      feedback: {
        correct: 'Correct. High efficiency plus high-speed switching before a filter is Class D.',
        incorrect: [
          { match: 'A', text: 'Class A would be hot at idle and inefficient, not a cool 90% switching stage.' },
          { match: 'B', text: 'Class B is a push-pull analog half-wave stage; the switching clue points elsewhere.' },
          { match: 'AB', text: 'Class AB is an analog biased push-pull stage. It does not normally show PWM switching before an LC filter.' },
        ],
        defaultIncorrect: 'The switching and filter clues are the giveaway.',
        insight:
          'Class D is recognized by the method, not by sound quality claims: PWM or related switching, MOSFET power pulses, then filtering.',
      },
    },
    {
      id: 'ac-compare',
      type: 'concept',
      title: 'The four classes are four tradeoff shapes',
      body: 'Class A: simplest handoff because there is no handoff, but very hot and inefficient. Class B: efficient split halves, but crossover distortion risk. Class AB: a little overlap to reduce crossover distortion, with moderate heat. Class D: switching plus filtering for very high efficiency, with more complexity in timing, layout, and filtering.\n\nNone of these labels guarantees a good or bad amplifier. The class tells you the design strategy. Parts, engineering, power supply, layout, protection, feedback, and load behavior decide how well that strategy is executed.',
    },
    {
      id: 'ac-application-match',
      type: 'problem',
      prompt: 'Match each amplifier class to the application where its tradeoffs make the most sense.',
      interaction: {
        kind: 'ampApplicationMatch',
        applications: [
          {
            id: 'boutique',
            label: 'Low-power boutique listening amp where heat and cost are acceptable',
            hint: 'The goal is simple linear operation, not efficiency.',
            correctClass: 'A',
          },
          {
            id: 'demo',
            label: 'Basic push-pull teaching circuit that demonstrates half-cycle handoff',
            hint: 'Useful for learning why the zero crossing can notch.',
            correctClass: 'B',
          },
          {
            id: 'receiver',
            label: 'Traditional analog stereo receiver with moderate heatsinks',
            hint: 'A practical compromise used in many classic hi-fi amplifiers.',
            correctClass: 'AB',
          },
          {
            id: 'portable',
            label: 'Battery speaker or compact high-power subwoofer plate amp',
            hint: 'Efficiency, low heat, and small size are the priority.',
            correctClass: 'D',
          },
        ],
      },
      feedback: {
        correct: 'Correct. Each class fits the application whose tradeoffs match its strengths.',
        incorrect: [
          { match: 'boutique', text: 'For the boutique low-power amp, think clean simple operation where heat is allowed: Class A.' },
          { match: 'demo', text: 'For the teaching circuit, the clue is half-cycle handoff and crossover notch: Class B.' },
          { match: 'receiver', text: 'For the classic analog receiver, the practical hi-fi compromise is Class AB.' },
          { match: 'portable', text: 'For battery or compact high-power use, efficiency and low heat point to Class D.' },
        ],
        defaultIncorrect: 'Match the job to the tradeoff: heat allowed, crossover lesson, analog compromise, or maximum efficiency.',
        insight:
          'The best class is contextual. A beautiful Class A headphone amp and a rugged Class D sub amp can both be excellent because they solve different problems.',
      },
    },
    {
      id: 'ac-sub',
      type: 'problem',
      prompt: 'You need a compact high-power subwoofer amplifier that wastes as little heat as possible. Which class fits best?',
      interaction: {
        kind: 'ampClassSelect',
        scenario: 'Compact high-power subwoofer amp, high efficiency, low heat.',
        target: 'D',
      },
      feedback: {
        correct: 'Correct. Class D is the natural choice for compact, efficient high-power subwoofer amps.',
        incorrect: [
          { match: 'A', text: 'Class A is clean but extremely inefficient and hot - the opposite of this goal.' },
          { match: 'B', text: 'Class B is efficient, but pure Class B crossover distortion makes it less common for finished hi-fi audio amps.' },
          { match: 'AB', text: 'Class AB can work, but it is still larger and hotter than Class D for this compact high-power job.' },
        ],
        defaultIncorrect: 'For compact high-power and low heat, choose Class D.',
        insight:
          'Class D wins when efficiency matters. That does not make every Class D amp automatically better, but it explains why it dominates powered subs and compact high-output amplifiers.',
      },
    },
    {
      id: 'ac-hifi',
      type: 'problem',
      prompt: 'You want a traditional analog hi-fi amplifier with low crossover distortion but better practicality than Class A. Which class is the common compromise?',
      interaction: {
        kind: 'ampClassSelect',
        scenario: 'Traditional hi-fi power amp: low distortion, reasonable heat, proven analog design.',
        target: 'AB',
      },
      feedback: {
        correct: 'Correct. Class AB is the classic analog hi-fi compromise: smoother than B, far more practical than A.',
        incorrect: [
          { match: 'A', text: 'Class A can be very clean, but the heat and wasted power make it less practical for this scenario.' },
          { match: 'B', text: 'Class B is efficient, but its crossover distortion is exactly what AB was designed to reduce.' },
          { match: 'D', text: 'Class D can be excellent, but the classic analog hi-fi compromise described here is Class AB.' },
        ],
        defaultIncorrect: 'The traditional balance here is Class AB.',
        insight:
          'AB is literally the compromise between A and B: enough bias to smooth the crossover, not enough to burn full Class A heat all the time.',
      },
    },
    {
      id: 'ac-wrap',
      type: 'concept',
      title: 'Read the class as a design clue, not a verdict',
      body: 'Class A tells you the output device conducts the whole waveform. Class B tells you the halves are split. Class AB tells you the split halves overlap. Class D tells you the output stage switches quickly and the filter reconstructs the audio.\n\nOnce you know that, specs become less mysterious. Heat, heatsink size, battery life, idle draw, crossover distortion, switching noise, and use case all start to point back to the same question: how are the output devices doing their work?',
    },
  ],
};
