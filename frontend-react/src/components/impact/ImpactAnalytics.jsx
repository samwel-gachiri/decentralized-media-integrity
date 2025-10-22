import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Card } from '../ui/Card';
import { Button } from '../ui/Button';
import { Badge } from '../ui/Badge';
import { LoadingSpinner } from '../ui/LoadingSpinner';
import { Toast } from '../ui/Toast';

const ImpactAnalytics = ({ eventId, showGlobalAnalytics = false }) => {
  const [analytics, setAnalytics] = useState(null);
  const [correlations, setCorrelations] = useState([]);
  const [trends, setTrends] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');
  const [timeframe, setTimeframe] = useState(365);
  const [toast, setToast] = useState(null);

  useEffect(() => {
    if (eventId) {
      loadEventAnalytics();
    } else if (showGlobalAnalytics) {
      loadGlobalAnalytics();
    }
  }, [eventId, showGlobalAnalytics, timeframe]);

  const loadEventAnalytics = async () => {
    try {
      setLoading(true);
      
      // Load event-specific impact analysis
      const analysisResponse = await fetch('/api/economic-impact/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ event_id: eventId })
      });

      if (analysisResponse.ok) {
        const analysisData = await analysisResponse.json();
        setAnalytics(analysisData);
        setCorrelations(analysisData.correlations || []);
      }

    } catch (error) {
      console.error('Error loading event analytics:', error);
      setToast({
        type: 'error',
        message: 'Failed to load event analytics'
      });
    } finally {
      setLoading(false);
    }
  };

  const loadGlobalAnalytics = async () => {
    try {
      setLoading(true);
      
      // Load global analytics
      const analyticsResponse = await fetch('/api/economic-impact/analytics', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ timeframe_days: timeframe })
      });

      if (analyticsResponse.ok) {
        const analyticsData = await analyticsResponse.json();
        setAnalytics(analyticsData.analytics);
      }

      // Load dashboard overview
      const overviewResponse = await fetch(`/api/economic-impact/dashboard/overview?timeframe_days=${timeframe}`);
      if (overviewResponse.ok) {
        const overviewData = await overviewResponse.json();
        setTrends(overviewData.recent_impacts || []);
      }

    } catch (error) {
      console.error('Error loading global analytics:', error);
      setToast({
        type: 'error',
        message: 'Failed to load analytics'
      });
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount);
  };

  const formatPercentage = (value) => {
    return `${(value * 100).toFixed(1)}%`;
  };

  const getRiskLevelColor = (level) => {
    const colors = {
      low: 'bg-green-100 text-green-800',
      medium: 'bg-yellow-100 text-yellow-800',
      high: 'bg-red-100 text-red-800',
      critical: 'bg-red-200 text-red-900'
    };
    return colors[level] || 'bg-gray-100 text-gray-800';
  };

  const getImpactTypeIcon = (impactType) => {
    const icons = {
      crop_failure: '🌾',
      livestock_death: '🐄',
      infrastructure_damage: '🏗️',
      water_scarcity: '💧',
      economic_loss: '💰'
    };
    return icons[impactType] || '📊';
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (!analytics) {
    return (
      <Card className="p-8 text-center">
        <div className="text-gray-500">
          <h3 className="text-lg font-medium text-gray-900 mb-2">No Analytics Available</h3>
          <p>Analytics data is not available for this event.</p>
        </div>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-gray-900">
          {eventId ? 'Event Impact Analysis' : 'Global Impact Analytics'}
        </h2>
        {showGlobalAnalytics && (
          <div className="flex items-center space-x-2">
            <label className="text-sm font-medium text-gray-700">Timeframe:</label>
            <select
              value={timeframe}
              onChange={(e) => setTimeframe(parseInt(e.target.value))}
              className="px-3 py-1 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value={30}>30 days</option>
              <option value={90}>90 days</option>
              <option value={365}>1 year</option>
              <option value={730}>2 years</option>
            </select>
          </div>
        )}
      </div>

      {/* Tab Navigation */}
      <div className="border-b border-gray-200">
        <nav className="-mb-px flex space-x-8">
          <button
            onClick={() => setActiveTab('overview')}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'overview'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            Overview
          </button>
          <button
            onClick={() => setActiveTab('predictions')}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'predictions'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            Impact Predictions
          </button>
          <button
            onClick={() => setActiveTab('correlations')}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'correlations'
     ics;mpactAnalytlt Ifauxport de};

e>
  );

    </div/>
      )})}
        nullsetToast(={() =>    onClose       essage}
toast.m   message={     }
  oast.typeype={t       tToast
   (
        <  {toast && 
       )}
 </div>
         }
           ) </Card>
           </div>
              lable.</p>
ecomes avaita bda more e asppear herll asis wind analy    <p>Tre            ble</h3>
ends Availa>No Tr-900 mb-2"t-grayt-medium tex"text-lg fonlassName=h3 c     <
           ay-500">"text-gre=ssNam  <div cla            enter">
"p-8 text-className=Card c       <
          ) : (iv>
           </d         ))}
           
/motion.div>     <        </Card>
               v>
        </di               v>
      </di                   /span>
nt_type}<trend.eveedium">{font-mName="n class <spa                      an>
 pe:</sp Ty">Event-gray-600"textsName=lasspan c   <                 en">
    twetify-bee="flex jusclassNam       <div      
           </div>                an>
     /sp || 0)}<ssstimated_lotrend.eurrency({formatCmedium">me="font-sNaclas <span                       </span>
 Loss:ated 00">Estimray-6-gme="textlassNapan c        <s              
  n">weefy-betjustiame="flex lassN <div c            
         ">smy-2 text-e="space-classNamdiv  <                   
                   iv>
 </d              >
      </Badge                     ent
         Rec          >
      e-800"00 text-blu-1lue="bg-bge className   <Bad                      </h4>
                
   ))}se(UpperCa l.to/g, l =>\w\b.replace(/('_', ' ')lace.rep.event_type?end  {tr                     
 00">gray-9ext-nt-medium t"foName=ass cl  <h4              4">
      b- mbetweenfy-ter justitems-cene="flex ilassNam     <div c           6">
    "p-sName=  <Card clas                 >
         1 }}
      : index * 0.elayition={{ d trans                }}
 le: 1 y: 1, scae={{ opacit     animat   
          .95 }}cale: 0ity: 0, spac={{ oinitial                {index}
   key=      
           ivotion.d    <m     
        => (ndex)rend, ids.map((ttren  {        ">
    ap-6ols-2 g:grid-cs-1 lgid grid-cole="grsNamdiv clas           <h > 0 ? (
 lengtrends. {t>
         "-y-6paceme="sv classNadi        <(
nalytics && howGlobalAds' && s'trenveTab === ti      {ac     )}

div>
      </   )}
          >
 </Card           </div>
             >
 able.</pailt data is av sufficienere onceear hppwill ais ion analysrelat <p>Cor           
    Found</h3>s relation Cor>Nomb-2"0 -gray-90medium text font-xt-lgteassName="<h3 cl               y-500">
 ra"text-gme=iv classNa         <d
     -center">="p-8 textlassNameCard c      < (
              ) :iv>
          </d}
          ))   
     iv>otion.d    </m       >
     rd/Ca  <            iv>
             </d
                </div>                  </div>
                    xed(2)}
   toFiinterval[1].ce_n.confidencorrelatio)} - {0].toFixed(2l[e_intervafidencrelation.con      {cor                    m">
t-mediusName="fonlasdiv c        <           >
     ce:</spanen>Confidgray-600"text-ssName="cla    <span                   >
  <div                     </div>
                  /div>
     d(4)}<xe_value.toFition.prrela">{coont-mediumassName="f    <div cl                  </span>
  e:P-Valugray-600">xt-"tesName=span clas     <            
           <div>                
      </div>                 }</div>
 _sizen.sampleelatiodium">{corrfont-meassName="    <div cl            n>
        Size:</spaple 00">Sam-6rayxt-gme="teassNa<span cl              
          div>         <           sm">
  -4 text-d-cols-3 gap gri="mt-4 gridv className   <di                     
            v>
       </di                /Badge>
        <      
         '}ak: 'WeModerate' .4 ? 'strength > 0relation_ation.corcorrel               
          rong' :? 'St > 0.7 _strengthrrelationrrelation.co       {co                  }>
                  
   00'-8edtext-rbg-red-100       '                w-800' :
  lloext-yelow-100 tbg-yel ? 'gth > 0.4renon_stlatin.corre correlatio                       0' :
green-80xt-green-100 te? 'bg-7 gth > 0._strenlation.correcorrelation                
        me={e classNa      <Badg     
           </div>                       </p>
            
           oFixed(3)}n_strength.ttioion.correlaelatrrcoh: {tion strengtla   Corre                      ">
 -600 mt-1t-graytext-sm texclassName="   <p              
        4>   </h            
         pe}ct_tyon.impa {correlatient_type} →relation.evor    {c              ">
        0ay-90 text-griume="font-med4 classNam          <h                  <div>
                  
start">s-tween itemfy-bejustime="flex div classNa         <       
    me="p-6">lassNaCard c   <               >
              0.1 }}
   ndex *y: ion={{ delaiti     trans      
       }}y: 1, y: 0 opacite={{ nimat      a        0 }}
    : 2pacity: 0, ynitial={{ o  i           
     ={index} key      
           otion.div      <m         => (
   index)n,relatioap((cor.mlations   {corre     ">
      e-y-4space="assNamcl <div       0 ? (
      > thions.lengrrelat   {co
       ce-y-6">ssName="spav cla     <di && (
   orrelations'Tab === 'c  {active)}

    div>
           </
             )}Card>
        </div>
     </             plete.</p>
sis is come once analyear hers will appctionmpact predi <p>I            e</h3>
   ns Availablredictio">No P-2 mb-900m text-grayg font-mediuext-lName="t class   <h3       ">
      -500xt-graytelassName="     <div c        enter">
 t-c8 tex"p-lassName=<Card c            (
     ) :     </div>
  
                   ))}>
      on.div </moti          
     </Card>              div>
        </           
          </div>                />
                    }}
     "easeOut"  : 1, ease:tionrasition={{ dutran                          ` }}
 * 100}%ty.probabiliiction: `${predate={{ widthanim                      0 }}
    th: wid{ tial={ni         i         
         }`}                   '
      -green-5000' : 'bg-50yellowg-4 ? 'blity > 0..probabidiction      pre                  ' :
    -500-red ? 'bg> 0.7ility on.probabicti  pred                   
       {full $-2 rounded-ssName={`hla          c             v
   n.di    <motio              >
      d-full h-2"0 rounde-gray-20ull bgssName="w-f<div cla                     >
       </div                /span>
ility)}<probabn.e(predictiomatPercentagspan>{for      <           
       /span>Probability<pan>Impact    <s                     -1">
500 mby-t-graexxt-xs t-between testifyme="flex julassNa      <div c          
      ">e="mt-4iv classNam      <d               Bar */}
ilityobab     {/* Pr           
       </div>
           div>
                </   
         )}</span>orece_scnfidenediction.coprtPercentage(m">{forma"font-mediue= classNam     <span            
       nce:</span>Confide-600">aytext-gre="ssNamspan cla  <               
       n text-sm">etweeustify-b j"flexe=ssNamv cla        <di        >
            </div            /span>
    e} days<timry_ecoveimated_riction.estdium">{predmeme="font-span classNa   <                   an>
  ime:</spRecovery T00">ay-6ext-grassName="tn cl     <spa              sm">
     ween text-fy-betlex justiame="f classN   <div            v>
           </di                 pan>
 ost)}</sted_cimaediction.estcy(prCurrenm">{format-mediu"fontame=n classN     <spa             
      pan>:</simated Costy-600">Estt-graexassName="t   <span cl                  
   t-sm">een textwify-bex just"flelassName=  <div c                 ">
   -y-3cee="spalassNamdiv c       <            
 div>
  </                 adge>
 </B                OW'}
      'LM' : 0.4 ? 'MEDIU> ty babilin.proedictio   pr                : 
      GH' HI7 ? 'y > 0.probabilittion.{predic                        )}>
               
       ow' 'ledium' :0.4 ? 'm > .probabilityprediction                       igh' : 
  0.7 ? 'hbility >robaprediction.p                   
     elColor(getRiskLev className={Badge           <          
 >div          </            >
    </div             
            </p>               ty)}
      babilin.proictioage(predntormatPercety: {flibabiPro                            ">
600 text-gray-"text-smsName=lasp c     <             4>
               </h                   
ase())}.toUpperCl => lw/g, place(/\b\).re('_', ' 'lacee.reptypn.impact_edictio   {pr                        
 -900">aym text-griunt-mede="fosNam4 clas     <h                    <div>
                       >
   </div                     
  pact_type)}on.imedictiypeIcon(prImpactT  {get                       
 t-2xl">ssName="tex    <div cla                  ">
  r space-x-3tems-centelex i"fssName=   <div cla              4">
     b-fy-between m-start justi"flex itemssName=div clas        <       6">
     sName="p-clasd        <Car     
              >         }}
 * 0.1 index delay:{{ion=    transit        
      : 0 }}y: 1, x{{ opacit  animate=              
  20 }}, x: -y: 0opacit{ nitial={          i    ndex}
    {i        key=         .div
   <motion      
        ndex) => (on, iti.map((predicionsredict{analytics.p          p-6">
     garid-cols-2:gs-1 lgrid grid-col="gme classNa    <div     0 ? (
   length > ions.dictcs.pre& analytiedictions &tics.pr     {analy">
     ce-y-6="spaNameass    <div cl(
    && ons'  'predictiTab ===ive{act

      )}div>
        </div>
        </motion.        Card>
       <//div>
              <v>
     di    </     
         </svg>             " />
   "evenoddipRule=-1-1z" cl 0 0002 0V6a1 1 01 1 01v3a1 1 0 00-1 012 0zm-1-8a2 0 1 1 0 a1 1 0 11-M11 135.58-9.92z8l-2.9-1.743-2.493-1.6462c-1.53 0.42 2.98H413 2.98-1.741.334-.22c.75  9.9l5.586 3.486 0 2.722-1.336765-1.257 3.099c." d="M8.ddule="eveno fillRth       <pa            20 20">
 "0 0 ewBox=" vientColorill="curr" f8 h-8assName="w-     <svg cl           -600">
  t-orange"ml-4 tex className=    <div         iv>
   /d      <          </div>
               >
        </Badge               se()}
UpperCaw').toisk || 'loll_r.overa(analytics      {             w')}>
   'lol_risk || overalanalytics.or(iskLevelColsName={getRas  <Badge cl            >
      t-1"ms-center m"flex itelassName=<div c            
      k Level</p>ay-600">Ristext-gredium -mm fonte="text-sam <p classN                 1">
ame="flex-classN      <div      er">
     s-cent"flex itemv className=      <di
        me="p-6">Card classNa  <
          
          > }}delay: 0.4on={{  transiti  
         , y: 0 }}pacity: 1{ oanimate={            }
, y: 20 }city: 0={{ opa  initial
          motion.div       <div>

   </motion.   d>
       Car          </v>
  /di         <
     iv>        </d      </svg>
             />
       " oddpRule="even00 4z" cli 0 02 24  0 100-4zm6 4a2 22-2v- 0 01-2 2H8a2 22 2 0 01- 0 012 2v4a012-2h8a2 2 0 a2 22H4zm2 62 0 00-2-a2 2V6h10 0 002 2v4a2 2a2 2 0 00-2 d" d="M4 4ule="evenod<path fillR                >
     20 20"wBox="0 0vie" rrentColorfill="cu-8 h-8" "w=ssNamecla   <svg               
 600">red-"ml-4 text-v className=         <di         </div>
           
     </p>              avg
   vent || 0)}per_eerage_loss_.avicscy(analytatCurren     {form               ray-500">
-xs text-g"textsName=     <p clas               </p>
            0)}
    | mic_loss |econoal_totcs.ncy(analytireormatCur  {f                  0">
ext-gray-90old tfont-b-2xl xt"teName=lass    <p c          
    /p>ss<Loic Econom">600y-m text-gram font-mediuame="text-s   <p classN           -1">
    ex"flssName=la    <div c        ter">
    ex items-cenName="fllass   <div c          p-6">
 className="      <Card  >
           .3 }}
    ={{ delay: 0tion      transi      y: 0 }}
 city: 1,={{ opa animate
           20 }}: 0, y: ={{ opacity  initial          
ion.div   <mot>

       /motion.div   <      </Card>
           v>
    </di            </div>
              </svg>
                />
    " noddpRule="eve4z" cli1.414 0l4-00l2 2a1 1 0 .4140-1.414 1293a1 1 0 0 7.707 9.10.586L9 -1.414.4140-1 0 03a1 13.707-9.2916zm 000 0-16 8 8 0a8 8 0 100 18odd" d="M1evenule=" fillRth   <pa        
         0 20"> 2ox="0 0wB" vientColorrrel="cu-8 h-8" filName="wlass    <svg c             >
 en-600"-4 text-gremle="sNam  <div clas           /div>
         <         </p>
               d
    ie| 0)} verifion_rate |.verificat(analyticsercentage    {formatP                0">
ay-50text-grxt-xs tessName="cla     <p         </p>
                  0}
       ||ied_eventsytics.verifnal   {a           ">
      t-gray-900ont-bold texxl f"text-2sName=as  <p cl           
     p>Events</>Verified -600"ray text-gdiummext-sm font-="temeclassNap          <     >
    "e="flex-1assNam  <div cl            ter">
  items-cen"flex ame=classN <div             6">
 "p-ssName= <Card cla                 >
  }}
   { delay: 0.2ansition={   tr}
         1, y: 0 }ity: acte={{ opima        an }}
    : 20, yopacity: 0 initial={{           
 ivn.d  <motio      

  ion.div>       </mot/Card>
              < </div>
            /div>
          <           </svg>
               enodd" />
le="evz" clipRu1 0 01-1-1110 2H4a1  1 0 12a10 011-1h 1 a10 4-1zm01-11 0 110 2H4a1 1 0 1h12a1 1- 1 0 011-1zm0 4a1 0 01- 10 110 2H4a11h12a1 1  011- 0"M3 4a1 1evenodd" d=e="lRulth fil       <pa           ">
  "0 0 20 20" viewBox=urrentColorl="ch-8" fil="w-8 sNameclas    <svg             ">
  lue-6004 text-be="ml-Nam <div class             div>
       </           >
        </p      }
    || 0otal_events tics.t      {analy       ">
       xt-gray-900d tefont-bol2xl t-"texme=<p classNa                  p>
l Events</Totay-600">ext-gra-medium txt-sm font"tessName=la       <p c
           flex-1">Name=" <div class          ">
     centerms-"flex iteclassName=iv       <d
        -6">Name="p class <Card            >
    .1 }}
     { delay: 0ition={      trans     : 0 }}
 city: 1, yopa animate={{          y: 20 }}
  ity: 0, ial={{ opacnit  i
          tion.divmo <         4 gap-6">
d-cols--2 lg:gririd-colsols-1 md:gd grid-c"gri=assNameiv cl
        <d(ew' && rviTab === 'ove    {active  ontent */}
 CTab      {/*  </div>


        </nav>    )}
          ton>
   </but     
     rends      T           >
           }`}
      0'
      -gray-30rderver:boho00 ay-7xt-grhover:tegray-500 parent text-der-transbor     : '          
   00'lue-6text-b500 order-blue-       ? 'b     
       'trends'ctiveTab ===        a{
         $ext-smdium t-mer-b-2 fontx-1 borde psName={`py-2      clas       s')}
 end('tretActiveTab) => sick={(nCl          o
    <button          s && (
  balAnalytic{showGlo      
      </button>     ations
   relCor               >
    }`}
               '
-300rder-grayhover:bogray-700 text--500 hover:t text-grayr-transparen: 'borde          600'
      -blue-00 textblue-5 ? 'border-          