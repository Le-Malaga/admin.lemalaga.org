-- Migration: Populate complete authentic carer stories into full_story and remove placeholder timeline steps
-- Date: 2026-11-17

UPDATE public.stories
SET
  full_story = $story$My passion for caring for residents living with dementia is deeply personal and comes from a part of my family's story that has stayed with me throughout my life.

Before my grandmother passed away in June 2002, she had a hidden diagnosis of dementia. At the time, many of the signs and symptoms she experienced were not immediately recognised for what they were. Looking back, I can now understand that some of the changes in her memory, behaviour, communication, mood and everyday abilities may have been hidden symptoms of dementia. What may have appeared to others as forgetfulness, confusion, changes in personality or simply getting older was actually part of something much deeper.

Losing my grandmother had a profound impact on me. As I have grown older and gained experience in dementia care, I have come to understand her journey in a completely different way. I often think about what she may have been experiencing and how different things might have been if we had understood the signs and symptoms earlier.

For the past 19 years, I have had the privilege of working in the care industry, supporting people and caring for residents with different needs, including those living with dementia. Over those years, I have learned that dementia is so much more than memory loss. It can affect a person's communication, emotions, behaviour, confidence, independence and ability to make sense of the world around them.

My grandmother is a big part of the reason I continue to do what I do. When I care for a resident living with dementia, I remind myself that behind every diagnosis is a person with a lifetime of memories, experiences, relationships and stories. I want to see the person first — not the dementia.

My motivation is to provide the care, patience, understanding and dignity that every person deserves. I want residents to feel safe, heard, respected and valued, even when they may no longer be able to express themselves in the same way they once did.

After 19 years in this industry, my passion remains strong because I know that the work we do can make a genuine difference to someone's quality of life and to their family. Every smile, every conversation, every moment of reassurance and every small act of kindness matters.

I may not have been able to care for my grandmother in the way I care for residents today, but I can honour her memory through the work I do every day.

My grandmother is my why. My 19 years in this industry are part of my journey, but my commitment to dementia care is my way of giving back, carrying her memory forward and making sure the people I care for are treated with the compassion, dignity and respect they deserve.

Love, Mel$story$,
  updated_at = now()
WHERE id = 'mel'
  AND (full_story IS NULL OR btrim(full_story) = '' OR full_story LIKE '%[Update this section%' OR full_story LIKE '%[Please update this section%');

UPDATE public.stories
SET
  full_story = $story$My name is Barry Lauaki. I take care of my mum; she has dementia and is 94 years old.

My mum is Samoan/Chinese and my late father was Samoan/Tongan. I have 3 Sisters and 3 Brothers.

I have been looking after my mum for 6 years. I love her so much.

Alofa Atu.$story$,
  updated_at = now()
WHERE id = 'barry'
  AND (full_story IS NULL OR btrim(full_story) = '' OR full_story LIKE '%[Update this section%' OR full_story LIKE '%[Please update this section%');

UPDATE public.stories
SET
  full_story = $story$My name is Fiapai Sauni and I take care of my grandparents, Lapaili Tupai Sauni who is 77 years old and Faamausili Sauni who is 80 years old, together with my mom and her 2 younger sisters. While everyone goes to work, I'd stay with my grandparents throughout the day.

I started noticing my grandma asking the same questions repeatedly back in 2020. Dementia came to mind, but wasn't really taken seriously until 2023 when she was diagnosed with dementia — then months later my mom stepped away from her job in 2022 to help out too.

Before dementia, my grandma was always getting things done. She'd always call everyone's phones just to say hello or ask what you're doing, she always held the family together, and she'd do her own pills and injections before and after meals. After being diagnosed, my mama would forget what she did or said in 5 minutes or less, my phone doesn't ring anymore, I don't get voicemails from her anymore, and she needs help with her medication — but one thing dementia hasn't taken from my mama is her savage comments and her dressing up well. My mama was always well dressed; we'd call her Elizabeth or Michelle Obama.

As for my papa, he is the strongest and most humble man I know! People back home in Mapusaga Fou, American Samoa nicknamed my grandpa Elvis because of the way he does his hair — not only how it's styled, but the way he combs it too, so we grew up watching and listening to Elvis Presley haha. The patience this man has with my grandma — my papa deserves to take all credit for taking care of my mama. Most nights he doesn't get much rest because he'd be massaging my grandma and making sure she's okay. Small kine complain, but still does it haha. When she upsets him, he'd go in the room and I'll find him praying for HER.

Through my papa I've learnt patience, faith, and humility! Through both of them I've learnt courage, charity, and service. It was hard in the beginning after mama was diagnosed, but as days went by I learnt to laugh with it because it is not my mama — it's the illness. I thank God for my mama and papa! I pray I get many, many more days to go on our car rides and get ice cream and pancakes.

Alofa'aga mo oulua e le mavae,
Le lua tausi ma'i fa'atigaulu,
Pai$story$,
  updated_at = now()
WHERE id = 'fiapai'
  AND (full_story IS NULL OR btrim(full_story) = '' OR full_story LIKE '%[Update this section%' OR full_story LIKE '%[Please update this section%');

UPDATE public.stories
SET
  full_story = $story$Talofa Lava,

My name is Lisa, and I am the sole carer of Mum Timuia Lauano. Life changed for both of us in 2015 when Mum was diagnosed with Dementia at the age of 68.

She loves her gardening, her beliefs, watching faleaitu videos on YouTube — especially Petelo and Sumeo (Iykyk lol) — café dates, and loves to eat seafood with talo. She was a hard-working, independent and resilient woman.

Dementia didn't arrive all at once. It came quietly, taking little pieces of Mum's memories, asking repetitive questions, her words, and the things she once did without thinking. At first, it was easy to brush off, but over time we realised our lives were changing in ways we never imagined. Today, Mum is bedridden. Some days she speaks a little, and other days she is silent. There are moments when she looks at me, and I wonder what she is thinking, but I choose to believe that somewhere deep inside, she still knows she is loved.

Some days are heartbreaking. Some days are exhausting. But every day is another chance to give back a small piece of the love she spent a lifetime giving to my siblings and me.

This is our journey. It isn't easy, but it is filled with compassion, patience and unconditional love. Dementia has taken many things, but it has never taken away her worth.

Love always mum,
Lisa$story$,
  updated_at = now()
WHERE id = 'lisa'
  AND (full_story IS NULL OR btrim(full_story) = '' OR full_story LIKE '%[Update this section%' OR full_story LIKE '%[Please update this section%');

UPDATE public.stories
SET
  full_story = $story$Our mum Loreta, known to many as Aunty Leka or Nana, was diagnosed in 2023 with dementia.

We had noticed things when we were on a cruise back in 2018 and she'd keep misplacing things, putting them down and not remembering to pick them back up again before leaving a room.

The progression of her dementia has been very noticeable over the past year, and she is now having trouble finding words for what she wants or where to go, which she finds really frustrating. She gets confused really easily with too much information, or forgets what she is wanting to tell us or why she even came to us.

We have a very tight-knit family and support each other, working out when we all need to pitch in to keep her entertained or have a change in scenery.

She has lived a very full life and enjoyed going to the gym, walking, playing lawn bowls, pool & darts — which she excelled in and competed throughout NZ in rep teams. She is our little wanderer, constantly looking for a reason to leave the house, and loves getting out and about — so if you see her out in the wild, don't be shy to say hi... she loves making new friends.

Love, Sina & Vera$story$,
  updated_at = now()
WHERE id = 'sina'
  AND (full_story IS NULL OR btrim(full_story) = '' OR full_story LIKE '%[Update this section%' OR full_story LIKE '%[Please update this section%');

UPDATE public.stories
SET
  full_story = $story$Kia Ora,

My name is Tania, I am from Hawkes Bay and I have been my Mum Roseanne's (Rosie Girl) caregiver since 2017. My Mum was diagnosed with Early Onset dementia in her late 50s and it has been a challenging, humbling, chaotic, and often very isolating journey.

It was a true blessing for me to connect with Le Malaga, who have wrapped around my whānau and I with so much love and support.

If this journey has taught me anything, it is that life is too short — live every moment you can and enjoy every laugh, even if it feels silly.$story$,
  updated_at = now()
WHERE id = 'tania'
  AND (full_story IS NULL OR btrim(full_story) = '' OR full_story LIKE '%[Update this section%' OR full_story LIKE '%[Please update this section%');

UPDATE public.stories
SET
  full_story = $story$1st of June 2025 marked Pablito (Dad) and Carmencita (Mum)'s 60th wedding anniversary. This was likely the last day all of us around this table would be together. My brother and his family came to Auckland from Massachusetts, USA and my younger sister came from Cebu, Philippines to witness this milestone — no small journey for any of us.

Days like this feel 'extra' — moments when love cuts through the fog, and we truly and in the fullest degree remember who we are to each other.

Dad is 88 and lives with vascular dementia. In September 2025 I made the hardest decision to move him into care — it was made out of love. I wanted him to have the dignity, safety, and professional care he deserves. I wanted Mum to be a wife again, not just a caregiver overwhelmed by the weight of Dad's illness.

Mum moved to live on her own to be closer to Dad. She is 84, and earlier this year, in March, she was diagnosed with breast cancer.

As the eldest and the only family they have here in Auckland, I do my best to be there for them both — to make sure they are seen, heard, and understood. Always.$story$,
  updated_at = now()
WHERE id = 'chichi'
  AND (full_story IS NULL OR btrim(full_story) = '' OR full_story LIKE '%[Update this section%' OR full_story LIKE '%[Please update this section%');

UPDATE public.stories
SET
  full_story = $story$I'm Sapini Unoi, a proud Samoan son, full-time carer and advocate whose journey into the dementia space began at home, caring for my beautiful mum.

Mum spent much of her life in service to others, first as a nurse and later as an educator. When dementia changed the course of our lives, I never imagined our journey would eventually become a way of serving others too.

Through sharing the realities of caring for Mum, I began connecting with other carers who understood the exhaustion, grief, laughter, love and isolation that can come with this journey. Those connections helped give life to Le Malaga.

For me, this work is deeply personal. It is one of the ways I honour Mum's legacy. She spent her life caring for, teaching and uplifting others, and today her story continues to do exactly that.

But Le Malaga has never been about one person. Alongside our fabulous committee and, most importantly, our carers and families, we are paving our own path — one shaped by lived experience, our Pacific values and the voices of the people actually walking this journey.

We may not have all the answers, but we know what it feels like to need someone beside you. So together, we're creating the kind of community we wish had been there when many of us first began caring.

Every carer who feels seen, every family that finds connection and every conversation we help change carries a little piece of Mum's legacy forward.

That, to me, is Le Malaga.$story$,
  updated_at = now()
WHERE id = 'pini'
  AND (full_story IS NULL OR btrim(full_story) = '' OR full_story LIKE '%[Update this section%' OR full_story LIKE '%[Please update this section%');

UPDATE public.stories
SET
  full_story = $story$Mum's dementia journey started about five years ago. At first, it was little things. She would forget things and tell us the same story over and over again. We knew something was changing, and after losing my brother a couple of years earlier, we knew that Mum was beginning her own dementia journey.

Over the years, Mum steadily declined. She began having falls, and because she had Arnold-Chiari malformation, her balance had never been great to begin with. Dementia only made things harder. Dad cared for Mum for as long as he could, but as she became more dependent, he told us a few times that he needed help. Eventually, Mum and Dad moved in with me and my family. Dad packed up their life and moved their whole world into ours. It was a huge change for them, especially for Mum. Even seven months later, she never really understood that this was home. Almost every night, she would tell Dad that they needed to get going and get home before it got too late.

Mum became frustrated with the things she could no longer remember or do. She struggled with counting, speaking and eventually even remembering our names. Her emotions became amplified too. When Mum felt something, she felt it deeply. But despite everything dementia took from her, there were things it could never take away.

Mum had the quickest wit and the best sense of humour. She could make us laugh with her bluntness and her cheeky comments. She never lost that part of herself, and for that, we will always be grateful. I remember coming home from work and Mum would be waiting for me. She didn't necessarily know that I was coming home, or even who she was waiting for. But she knew I wasn't there. Somehow, she could feel my absence.

That was how we learned to live with dementia. We stopped worrying about what Mum should remember and simply met her where she was. We took each day as it came. Every morning was a new day, a new slate, and we took whatever that day had to offer us.

There were hard days. There were frustrating days. There were days when we had to laugh because sometimes laughing was the only thing we could do. But there were also so many beautiful moments.

Then, on the morning of Monday, 3 August, everything changed. Mum suffered a massive stroke. Five days later, she passed away. And now we are learning how to live without her.

We miss her incredibly, every single day. We miss her innocence. We miss her quick wit, her sense of humour and her bluntness. We miss her laugh. We miss the little things we probably never realised we would miss until they were gone. Most of all, we miss Mum.

Dementia may have slowly taken pieces of her from us over the years, but it never took the essence of who she was. She was still our Mum. She was still loved. She was still funny. She was still fiercely herself.

And I am so incredibly thankful for her. Thankful that I got to have her as my Mum. Thankful that we got those extra years with her. Thankful that we were able to bring Mum and Dad into our home and care for them when they needed us most. I wish I could have had more time with her. I wish the ending had been different. But I will always be grateful for every memory, every laugh, every story — even the ones she told us over and over again.

Mum, I hope you are finally at peace. We will carry you with us, always. And we will love you forever.$story$,
  updated_at = now()
WHERE id = 'jennifer'
  AND (full_story IS NULL OR btrim(full_story) = '' OR full_story LIKE '%[Update this section%' OR full_story LIKE '%[Please update this section%');

UPDATE public.stories
SET
  full_story = $story$Built for this season — in 2019 my husband and I decided to move in to my parents as my Dad's health started to decline and Mum was no longer fit to care for him.

During the months of Dad's health deteriorating is when Mum was also mentally declining. When Dad's hospital stays became longer, Mum started to hallucinate, became paranoid and started to wander off to find her husband, and then become lost.

In 2022, after Dad had passed and Mum had soon forgotten her love, all the aggression, the wandering and the paranoia disappeared and Mum had become solely reliant on me for hygiene care, meal preparations, etc.

Six years has been an absolute learning experience and I know there's so much more to learn, but I wouldn't be able to care for Mum if it wasn't for my husband and our 6 babies — my little Co-Care team — My Village.

Grateful for My Family & My Faith. Being a Carer has its downs, but I'm grateful that the positives have shaped me to be the Mother I am to my kids and the Daughter I am to my Mama.$story$,
  updated_at = now()
WHERE id = 'ruby'
  AND (full_story IS NULL OR btrim(full_story) = '' OR full_story LIKE '%[Update this section%' OR full_story LIKE '%[Please update this section%');

-- Remove placeholder timeline steps across all stories
UPDATE public.stories
SET
  timeline = COALESCE(
    (
      SELECT jsonb_agg(step)
      FROM jsonb_array_elements(timeline) AS step
      WHERE COALESCE(step->>'text', '') NOT LIKE '%[Update this section%'
        AND COALESCE(step->>'text', '') NOT LIKE '%[Please update this section%'
        AND btrim(COALESCE(step->>'text', '')) <> ''
    ),
    '[]'::jsonb
  ),
  updated_at = now()
WHERE timeline IS NOT NULL
  AND jsonb_array_length(timeline) > 0
  AND EXISTS (
    SELECT 1
    FROM jsonb_array_elements(timeline) AS step
    WHERE COALESCE(step->>'text', '') LIKE '%[Update this section%'
       OR COALESCE(step->>'text', '') LIKE '%[Please update this section%'
  );
